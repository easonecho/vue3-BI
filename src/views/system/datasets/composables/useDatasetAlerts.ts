/**
 * 数据集告警弹窗逻辑
 *
 * 负责规则/告警记录的加载、开关、执行、删除与已读操作，
 * 通过依赖注入 datasetId 解耦父组件，便于单测。
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  deleteAlertRule,
  getAlertEvents,
  getAlertRules,
  markAlertEventRead,
  markAllAlertEventsRead,
  runAlertRule,
  updateAlertRule,
  type AlertEvent,
  type AlertRule,
} from '@/api/alert'
import { executeDataset, getDatasetDetail } from '@/api/dataset'

export interface DatasetAlertsDeps {
  getDatasetId: () => number | null
}

export const ALERT_EVENT_PAGE_SIZE = 10

export function useDatasetAlerts(deps: DatasetAlertsDeps) {
  const rules = ref<AlertRule[]>([])
  const events = ref<AlertEvent[]>([])
  const loadingRules = ref(false)
  const loadingEvents = ref(false)
  const unreadCount = ref(0)
  const eventPage = ref(1)
  const eventPageSize = ALERT_EVENT_PAGE_SIZE
  const eventTotal = ref(0)
  const fieldOptions = ref<string[]>([])

  /** 打开弹窗：并行加载字段、规则与未读数 */
  function onOpen() {
    void loadFields()
    void loadRules()
    void loadUnreadCount()
  }

  function handleClosed() {
    rules.value = []
    events.value = []
    unreadCount.value = 0
    eventPage.value = 1
    eventTotal.value = 0
  }

  async function loadFields() {
    const datasetId = deps.getDatasetId()
    if (datasetId === null || datasetId === undefined) return
    const names = new Set<string>()
    try {
      const detail = await getDatasetDetail(datasetId)
      const fields = detail.data.fields
      if (Array.isArray(fields)) {
        for (const item of fields as Record<string, unknown>[]) {
          const name = (item.alias as string) || (item.name as string)
          if (name) names.add(name)
        }
      }
    } catch {
      // 字段获取失败不阻断规则管理
    }
    try {
      const res = await executeDataset(datasetId, { limit: 1 })
      for (const column of res.data.columns ?? []) names.add(column)
    } catch {
      // 数据集暂时不可查询时允许手动输入字段
    }
    fieldOptions.value = Array.from(names)
  }

  async function loadRules() {
    const datasetId = deps.getDatasetId()
    if (datasetId === null || datasetId === undefined) return
    loadingRules.value = true
    try {
      const res = await getAlertRules(datasetId)
      rules.value = res.data
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '加载告警规则失败')
    } finally {
      loadingRules.value = false
    }
  }

  async function loadEvents() {
    const datasetId = deps.getDatasetId()
    if (datasetId === null || datasetId === undefined) return
    loadingEvents.value = true
    try {
      const res = await getAlertEvents({
        datasetId,
        page: eventPage.value,
        pageSize: eventPageSize,
      })
      events.value = res.data.list
      eventTotal.value = res.data.total
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '加载告警记录失败')
    } finally {
      loadingEvents.value = false
    }
  }

  async function loadUnreadCount() {
    const datasetId = deps.getDatasetId()
    if (datasetId === null || datasetId === undefined) return
    try {
      const res = await getAlertEvents({ datasetId, status: 0, page: 1, pageSize: 1 })
      unreadCount.value = res.data.total
    } catch {
      unreadCount.value = 0
    }
  }

  async function toggleEnabled(row: AlertRule) {
    try {
      await updateAlertRule(row.id, { enabled: row.enabled })
      ElMessage.success(row.enabled ? '规则已启用' : '规则已停用')
    } catch (e) {
      row.enabled = !row.enabled
      ElMessage.error(e instanceof Error ? e.message : '操作失败')
    }
  }

  async function removeRule(row: AlertRule) {
    try {
      await deleteAlertRule(row.id)
      ElMessage.success('规则已删除')
      await loadRules()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  async function runRule(row: AlertRule) {
    try {
      const res = await runAlertRule(row.id)
      const result = res.data
      if (result.triggered) {
        ElMessage.warning(`已触发告警，当前值 ${result.value}`)
        await loadUnreadCount()
      } else {
        ElMessage.success(`未触发，当前值 ${result.value}`)
      }
      await loadRules()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '执行失败')
    }
  }

  async function readEvent(row: AlertEvent) {
    try {
      await markAlertEventRead(row.id)
      row.status = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '操作失败')
    }
  }

  async function readAll() {
    const datasetId = deps.getDatasetId()
    if (datasetId === null || datasetId === undefined) return
    try {
      await markAllAlertEventsRead(datasetId)
      ElMessage.success('已全部标记为已读')
      unreadCount.value = 0
      await loadEvents()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '操作失败')
    }
  }

  return {
    rules,
    events,
    loadingRules,
    loadingEvents,
    unreadCount,
    eventPage,
    eventPageSize,
    eventTotal,
    fieldOptions,
    onOpen,
    handleClosed,
    loadFields,
    loadRules,
    loadEvents,
    loadUnreadCount,
    toggleEnabled,
    removeRule,
    runRule,
    readEvent,
    readAll,
  }
}

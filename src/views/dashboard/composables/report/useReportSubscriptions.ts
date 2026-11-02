import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  deleteReportSubscription,
  getReportSubscriptions,
  runReportSubscription,
  updateReportSubscription,
  type ReportSubscription,
} from '@/api/report'

export interface ReportSubscriptionsDeps {
  getDashboardId: () => number | null
  getActiveTab: () => 'subs' | 'deliveries'
  loadUnreadCount: () => void | Promise<void>
  loadDeliveries: () => void | Promise<void>
}

/**
 * 🔑 定时报表订阅列表与行操作。
 *
 * 从 ReportSubscriptionDialog.vue 抽出：加载、启停、删除、立即生成。
 */
export function useReportSubscriptions(deps: ReportSubscriptionsDeps) {
  const subscriptions = ref<ReportSubscription[]>([])
  const loadingSubs = ref(false)

  async function loadSubscriptions() {
    const dashboardId = deps.getDashboardId()
    if (!dashboardId) return
    loadingSubs.value = true
    try {
      const res = await getReportSubscriptions(dashboardId)
      subscriptions.value = res.data
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '加载报表订阅失败')
    } finally {
      loadingSubs.value = false
    }
  }

  async function toggleEnabled(row: ReportSubscription) {
    try {
      await updateReportSubscription(row.id, { enabled: row.enabled })
      ElMessage.success(row.enabled ? '订阅已启用' : '订阅已停用')
    } catch (e) {
      row.enabled = !row.enabled
      ElMessage.error(e instanceof Error ? e.message : '操作失败')
    }
  }

  async function removeSubscription(row: ReportSubscription) {
    try {
      await deleteReportSubscription(row.id)
      ElMessage.success('订阅已删除')
      await loadSubscriptions()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  async function runNow(row: ReportSubscription) {
    try {
      const res = await runReportSubscription(row.id)
      if (res.data.status === 'failed') {
        ElMessage.error(res.data.message || '报表生成失败')
      } else {
        ElMessage.success(res.data.message || '报表已生成')
      }
      await loadSubscriptions()
      await deps.loadUnreadCount()
      if (deps.getActiveTab() === 'deliveries') await deps.loadDeliveries()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '生成失败')
    }
  }

  function resetSubscriptions() {
    subscriptions.value = []
  }

  return {
    subscriptions,
    loadingSubs,
    loadSubscriptions,
    toggleEnabled,
    removeSubscription,
    runNow,
    resetSubscriptions,
  }
}

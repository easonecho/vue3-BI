import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import i18n from '@/i18n'
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
      ElMessage.error(e instanceof Error ? e.message : i18n.global.t('dashboard.reportLoadFailed'))
    } finally {
      loadingSubs.value = false
    }
  }

  async function toggleEnabled(row: ReportSubscription) {
    try {
      await updateReportSubscription(row.id, { enabled: row.enabled })
      ElMessage.success(
        i18n.global.t(row.enabled ? 'dashboard.reportEnabledDone' : 'dashboard.reportDisabledDone'),
      )
    } catch (e) {
      row.enabled = !row.enabled
      ElMessage.error(
        e instanceof Error ? e.message : i18n.global.t('dashboard.reportToggleFailed'),
      )
    }
  }

  async function removeSubscription(row: ReportSubscription) {
    try {
      await deleteReportSubscription(row.id)
      ElMessage.success(i18n.global.t('dashboard.reportDeleted'))
      await loadSubscriptions()
    } catch (e) {
      ElMessage.error(
        e instanceof Error ? e.message : i18n.global.t('dashboard.reportDeleteFailed'),
      )
    }
  }

  async function runNow(row: ReportSubscription) {
    try {
      const res = await runReportSubscription(row.id)
      if (res.data.status === 'failed') {
        ElMessage.error(res.data.message || i18n.global.t('dashboard.reportRunFailedMessage'))
      } else {
        ElMessage.success(res.data.message || i18n.global.t('dashboard.reportRunSuccess'))
      }
      await loadSubscriptions()
      await deps.loadUnreadCount()
      if (deps.getActiveTab() === 'deliveries') await deps.loadDeliveries()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : i18n.global.t('dashboard.reportRunFailed'))
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

import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getReportDeliveries,
  markReportDeliveryRead,
  type ReportDelivery,
  type ReportSnapshot,
} from '@/api/report'

export interface ReportDeliveriesDeps {
  getDashboardId: () => number | null
}

/**
 * 🔑 定时报表「投递记录」与快照预览。
 *
 * 从 ReportSubscriptionDialog.vue 抽出，负责分页、未读数、标记已读与预览内容解析。
 */
export function useReportDeliveries(deps: ReportDeliveriesDeps) {
  const deliveries = ref<ReportDelivery[]>([])
  const loadingDeliveries = ref(false)
  const unreadCount = ref(0)
  const deliveryPage = ref(1)
  const deliveryPageSize = 10
  const deliveryTotal = ref(0)

  // 报表快照预览
  const previewVisible = ref(false)
  const previewTitle = ref('报表预览')
  const previewError = ref('')
  const snapshot = ref<ReportSnapshot | null>(null)

  async function loadDeliveries() {
    const dashboardId = deps.getDashboardId()
    if (!dashboardId) return
    loadingDeliveries.value = true
    try {
      const res = await getReportDeliveries({
        dashboardId,
        page: deliveryPage.value,
        pageSize: deliveryPageSize,
      })
      deliveries.value = res.data.list
      deliveryTotal.value = res.data.total
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '加载投递记录失败')
    } finally {
      loadingDeliveries.value = false
    }
  }

  async function loadUnreadCount() {
    const dashboardId = deps.getDashboardId()
    if (!dashboardId) return
    try {
      const res = await getReportDeliveries({
        dashboardId,
        unreadOnly: true,
        page: 1,
        pageSize: 1,
      })
      unreadCount.value = res.data.total
    } catch {
      unreadCount.value = 0
    }
  }

  function resetPreview() {
    previewVisible.value = false
    previewTitle.value = '报表预览'
    previewError.value = ''
    snapshot.value = null
  }

  function resetDeliveries() {
    deliveries.value = []
    unreadCount.value = 0
    deliveryPage.value = 1
    deliveryTotal.value = 0
    resetPreview()
  }

  async function previewDelivery(row: ReportDelivery) {
    previewTitle.value = row.title
    previewError.value = ''
    const content = row.content as ReportSnapshot | { error?: string }
    if (content && Array.isArray((content as ReportSnapshot).charts)) {
      snapshot.value = content as ReportSnapshot
    } else {
      snapshot.value = null
      previewError.value = (content as { error?: string })?.error || ''
    }
    previewVisible.value = true

    if (row.readFlag === 0) {
      try {
        await markReportDeliveryRead(row.id)
        row.readFlag = 1
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      } catch {
        // 标记已读失败不影响预览
      }
    }
  }

  return {
    deliveries,
    loadingDeliveries,
    unreadCount,
    deliveryPage,
    deliveryPageSize,
    deliveryTotal,
    previewVisible,
    previewTitle,
    previewError,
    snapshot,
    loadDeliveries,
    loadUnreadCount,
    resetPreview,
    resetDeliveries,
    previewDelivery,
  }
}

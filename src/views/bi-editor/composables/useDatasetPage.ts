/**
 * ============================================================================
 * 数据集服务端分页 composable (W4)
 * - 表格组件不再一次性拉取全量行，改为按页请求 `/rows`
 * - 与服务端聚合查询共享「全局筛选 / 图表联动 / 钻取」条件
 * - 公开分享页自动走 `/api/public/dashboards/:token/...` 匿名接口
 * ============================================================================
 */
import { computed, getCurrentInstance, onUnmounted, ref, watch, type Ref } from 'vue'
import {
  fetchDatasetPage,
  type DatasetPageParams,
  type RowCondition,
} from '@/api/dataset'
import { fetchPublicDatasetPage } from '@/api/share'
import { getPublicDashboardContext } from '@/utils/public-dashboard-context'
import { useLinkageStore } from '@/stores/linkage'
import { buildAggregateFilters } from './aggregate-request'
import { refreshSignal } from './useDatasetBinding'

export interface DatasetPageControls {
  page: Ref<number>
  pageSize: Ref<number>
  sortField: Ref<string>
  sortOrder: Ref<'asc' | 'desc' | null>
  /** 覆盖默认联动筛选（可选） */
  filters?: Ref<RowCondition[] | undefined>
}

export function useDatasetPage(
  dataSource: Ref<{ datasetId: number | null }>,
  controls: DatasetPageControls,
) {
  const linkageStore = useLinkageStore()
  const rows = ref<Record<string, unknown>[]>([])
  const columns = ref<string[]>([])
  const total = ref<number | undefined>(undefined)
  const hasMore = ref(false)
  const loading = ref(false)
  const error = ref('')

  const componentId = (() => {
    const comp = (getCurrentInstance()?.props as Record<string, unknown> | undefined)?.comp as
      | { id?: string }
      | undefined
    return comp?.id ? String(comp.id) : undefined
  })()

  /** 与服务端聚合查询一致的筛选语义（字段使用展示名） */
  const filters = computed<RowCondition[]>(() => {
    if (controls.filters?.value) return controls.filters.value
    return buildAggregateFilters(
      linkageStore.filterValues,
      linkageStore.linkFilters,
      componentId ? linkageStore.getDrillStack(componentId) : [],
      componentId,
    )
  })

  let requestSeq = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearState() {
    rows.value = []
    columns.value = []
    total.value = undefined
    hasMore.value = false
    error.value = ''
  }

  async function loadNow() {
    const datasetId = dataSource.value.datasetId
    if (!datasetId) {
      clearState()
      return
    }

    const seq = ++requestSeq
    // pageSize=0 表示「不分页」：取服务端单页上限，避免退化成每页 1 行
    const pageSize = controls.pageSize.value > 0 ? controls.pageSize.value : 1000
    const page = Math.max(1, controls.page.value)
    const body: DatasetPageParams = {
      offset: (page - 1) * pageSize,
      limit: pageSize,
      sortBy: controls.sortField.value || undefined,
      sortOrder: controls.sortOrder.value ?? undefined,
      filters: filters.value.length > 0 ? filters.value : undefined,
      // 表格分页器需要总行数；服务端对 COUNT(*) 做了 60s 短缓存
      withTotal: true,
    }

    loading.value = true
    error.value = ''
    try {
      const publicCtx = getPublicDashboardContext()
      const res = publicCtx
        ? await fetchPublicDatasetPage(publicCtx.token, datasetId, {
            ...body,
            password: publicCtx.password,
          })
        : await fetchDatasetPage(datasetId, body)
      if (seq !== requestSeq) return

      rows.value = (res.data.rows ?? []) as Record<string, unknown>[]
      columns.value = res.data.columns ?? []
      total.value = res.data.total
      hasMore.value = !!res.data.hasMore
    } catch (e) {
      if (seq !== requestSeq) return
      console.error('[useDatasetPage] 取数失败:', e)
      error.value = e instanceof Error ? e.message : '数据加载失败'
      clearState()
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  /** 合并同一轮响应式变化触发的多次请求 */
  function scheduleLoad() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void loadNow()
    }, 0)
  }

  watch(
    () => [
      dataSource.value.datasetId,
      controls.page.value,
      controls.pageSize.value,
      controls.sortField.value,
      controls.sortOrder.value,
      JSON.stringify(filters.value),
      refreshSignal.value,
    ],
    scheduleLoad,
    { immediate: true },
  )

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    requestSeq++
  })

  return { rows, columns, total, hasMore, loading, error, reload: loadNow }
}

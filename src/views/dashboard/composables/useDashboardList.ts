import { computed, reactive, ref } from 'vue'
import {
  getDashboardList,
  toggleFavorite,
  type DashboardListCounts,
  type DashboardListQuery,
  type DashboardSortBy,
} from '@/api/dashboard'
import { getDashboardGroupList } from '@/api/dashboard-group'
import type { Dashboard, DashboardGroup } from '@/api/types'

export interface DashboardFilters {
  keyword: string
  status?: number
  isPublic?: boolean
  onlyFavorites: boolean
}

/**
 * 🔑 看板列表 / 筛选 / 分页 / 收藏 / 分组数据。
 *
 * 从 dashboard/index.vue 抽出，页面只保留组合与模板结构。
 */
export function useDashboardList() {
  const list = ref<Dashboard[]>([])
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(12)
  const total = ref(0)

  // 统计：优先使用服务端全量统计，旧接口无该字段时回落到当前页统计
  const counts = ref<DashboardListCounts | null>(null)
  const publishedCount = computed(
    () => counts.value?.published ?? list.value.filter((d) => d.status === 1).length,
  )
  const draftCount = computed(
    () => counts.value?.draft ?? list.value.filter((d) => d.status === 0).length,
  )

  // 筛选条件
  const filters = reactive<DashboardFilters>({
    keyword: '',
    status: undefined,
    isPublic: undefined,
    onlyFavorites: false,
  })
  const groupFilter = ref<number | 'ungrouped' | undefined>(undefined)
  // 排序方式：默认最近创建
  const sortBy = ref<DashboardSortBy>('createdAt')

  // P2-3: 分组
  const groups = ref<DashboardGroup[]>([])
  const groupsLoading = ref(false)
  let loadSeq = 0

  async function loadList() {
    // 🔑 请求序号：筛选快速切换时丢弃过期响应，避免旧结果覆盖新结果
    const seq = ++loadSeq
    loading.value = true
    try {
      const params: DashboardListQuery = {
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword || undefined,
        status: filters.status,
        isPublic: filters.isPublic,
        onlyFavorites: filters.onlyFavorites || undefined,
        sortBy: sortBy.value,
      }
      if (groupFilter.value === 'ungrouped') {
        params.ungrouped = true
      } else if (groupFilter.value !== undefined) {
        params.groupId = groupFilter.value
      }
      const res = await getDashboardList(params)
      if (seq !== loadSeq) return
      list.value = res.data.list
      total.value = res.data.total
      counts.value = res.data.counts ?? null
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  }

  function handleSearch() {
    page.value = 1
    void loadList()
  }

  function handleReset() {
    filters.keyword = ''
    filters.status = undefined
    filters.isPublic = undefined
    filters.onlyFavorites = false
    groupFilter.value = undefined
    sortBy.value = 'createdAt'
    page.value = 1
    void loadList()
  }

  // ========== 收藏功能 (4.4) ==========
  function isFavorited(item: Dashboard): boolean {
    return !!(item.favorites && item.favorites.length > 0)
  }

  async function handleToggleFavorite(item: Dashboard) {
    try {
      const res = await toggleFavorite(item.id)
      if (res.data.isFavorited) {
        item.favorites = [{ id: -1 }]
      } else {
        item.favorites = []
      }
      if (filters.onlyFavorites && !res.data.isFavorited) {
        list.value = list.value.filter((d) => d.id !== item.id)
        total.value = Math.max(0, total.value - 1)
      }
    } catch {
      // 错误提示由 request 拦截器统一处理
    }
  }

  function toggleFavoritesFilter() {
    filters.onlyFavorites = !filters.onlyFavorites
    page.value = 1
    void loadList()
  }

  async function loadGroups() {
    groupsLoading.value = true
    try {
      const res = await getDashboardGroupList()
      groups.value = res.data
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      groupsLoading.value = false
    }
  }

  /** 删除成功后：当前页最后一条则回退一页并刷新 */
  async function handleDeleted() {
    if (list.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadList()
  }

  /** 页面初始化：并行拉取看板列表与分组 */
  function init() {
    void loadList()
    void loadGroups()
  }

  return {
    list,
    loading,
    page,
    pageSize,
    total,
    publishedCount,
    draftCount,
    filters,
    groupFilter,
    sortBy,
    groups,
    groupsLoading,
    loadList,
    loadGroups,
    handleSearch,
    handleReset,
    isFavorited,
    handleToggleFavorite,
    toggleFavoritesFilter,
    handleDeleted,
    init,
  }
}

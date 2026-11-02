import { computed, reactive, ref } from 'vue'
import { getDashboardList, toggleFavorite, type DashboardListQuery } from '@/api/dashboard'
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

  // 统计
  const publishedCount = computed(() => list.value.filter((d) => d.status === 1).length)
  const draftCount = computed(() => list.value.filter((d) => d.status === 0).length)

  // 筛选条件
  const filters = reactive<DashboardFilters>({
    keyword: '',
    status: undefined,
    isPublic: undefined,
    onlyFavorites: false,
  })
  const groupFilter = ref<number | 'ungrouped' | undefined>(undefined)

  // P2-3: 分组
  const groups = ref<DashboardGroup[]>([])
  const groupsLoading = ref(false)

  async function loadList() {
    loading.value = true
    try {
      const params: DashboardListQuery = {
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword || undefined,
        status: filters.status,
        isPublic: filters.isPublic,
        onlyFavorites: filters.onlyFavorites || undefined,
      }
      if (groupFilter.value === 'ungrouped') {
        params.ungrouped = true
      } else if (groupFilter.value !== undefined) {
        params.groupId = groupFilter.value
      }
      const res = await getDashboardList(params)
      list.value = res.data.list
      total.value = res.data.total
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      loading.value = false
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

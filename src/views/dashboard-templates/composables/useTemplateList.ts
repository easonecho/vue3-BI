import { computed, reactive, ref } from 'vue'
import {
  getDashboardTemplateList,
  getTemplateCategories,
  type DashboardTemplate,
  type DashboardTemplateListQuery,
  type TemplateCategoryOption,
} from '@/api/dashboard-template'

export type TemplateTab = 'all' | 'preset' | 'user'
export type TemplateSort = 'updated' | 'created' | 'name'

export interface TemplateFilters {
  keyword: string
  category?: string
  isPublic?: boolean
  sort: TemplateSort
}

/**
 * 🔑 模板管理页的列表/筛选状态。
 *
 * 从 dashboard-templates/index.vue 抽出：
 *   - 数据拉取（Tab → isSystem 查询参数）
 *   - 统计（总数/预置/用户）
 *   - 客户端关键字/分类/公开性过滤
 *   - 排序（最近更新/最近创建/名称）
 */
export function useTemplateList() {
  const list = ref<DashboardTemplate[]>([])
  const categories = ref<TemplateCategoryOption[]>([])
  const loading = ref(false)

  const total = computed(() => list.value.length)
  const presetCount = computed(() => list.value.filter((x) => x.isSystem).length)
  const userCount = computed(() => list.value.filter((x) => !x.isSystem).length)

  /** 当前分类 Tab: all=全部, preset=预置模板, user=用户模板 */
  const activeTab = ref<TemplateTab>('all')

  const filters = reactive<TemplateFilters>({
    keyword: '',
    category: undefined,
    isPublic: undefined,
    sort: 'updated',
  })

  /** 客户端过滤后的列表 */
  const filteredList = computed(() => {
    return list.value.filter((x) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        const hit = x.name.toLowerCase().includes(kw) || (x.description || '').toLowerCase().includes(kw)
        if (!hit) return false
      }
      if (filters.category !== undefined && x.category !== filters.category) return false
      if (filters.isPublic !== undefined && x.isPublic !== filters.isPublic) return false
      return true
    })
  })

  /** 排序：最近更新 / 最近创建 / 名称 */
  const sortedList = computed(() => {
    const arr = [...filteredList.value]
    const timeOf = (v?: string) => {
      if (!v) return 0
      const t = new Date(v).getTime()
      return Number.isNaN(t) ? 0 : t
    }
    if (filters.sort === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    } else if (filters.sort === 'created') {
      arr.sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
    } else {
      arr.sort((a, b) => timeOf(b.updatedAt) - timeOf(a.updatedAt))
    }
    return arr
  })

  async function loadList() {
    loading.value = true
    try {
      const query: DashboardTemplateListQuery = {}
      if (activeTab.value === 'preset') query.isSystem = true
      else if (activeTab.value === 'user') query.isSystem = false
      const res = await getDashboardTemplateList(query)
      list.value = res.data
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      loading.value = false
    }
  }

  async function loadCategories() {
    try {
      const res = await getTemplateCategories()
      categories.value = res.data
    } catch {
      // 分类枚举拉取失败时静默，筛选下拉退化为空
    }
  }

  /** Tab 切换时重置分类筛选并重新拉取数据 */
  function handleTabChange() {
    filters.category = undefined
    filters.isPublic = undefined
    loadList()
  }

  function resetFilters() {
    filters.keyword = ''
    filters.category = undefined
    filters.isPublic = undefined
    filters.sort = 'updated'
  }

  return {
    list,
    categories,
    loading,
    total,
    presetCount,
    userCount,
    activeTab,
    filters,
    filteredList,
    sortedList,
    loadList,
    loadCategories,
    handleTabChange,
    resetFilters,
  }
}

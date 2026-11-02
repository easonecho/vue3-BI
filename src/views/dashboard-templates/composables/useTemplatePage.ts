import type { Router } from 'vue-router'
import type { DashboardTemplate } from '@/api/dashboard-template'
import { useTemplateList } from './useTemplateList'
import { useTemplateActions, type TemplateTranslate } from './useTemplateActions'
import { useTemplateApply } from './useTemplateApply'

export interface TemplatePageDeps {
  router: Router
  t: TemplateTranslate
}

/**
 * 🔑 模板管理页的页面装配层。
 *
 * 把列表/筛选、卡片操作、应用模板三个 composable 连接起来，
 * 并为 index.vue 提供分类文案、预览跳转与初始化入口，
 * 让页面文件只保留模板结构与 onMounted(init)。
 */
export function useTemplatePage(deps: TemplatePageDeps) {
  const { router, t } = deps

  const {
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
  } = useTemplateList()

  const { applyVisible, applying, applyTarget, openApply, confirmApply } = useTemplateApply({
    router,
    t,
  })

  const { openCreate, openEdit, handleCommand } = useTemplateActions({
    router,
    t,
    reload: loadList,
    openApply,
  })

  /** 客户端过滤由 filteredList computed 自动响应，此处仅保留触发点 */
  function handleSearch() {}

  /** 根据 category value 获取本地化显示文本 */
  function categoryLabel(value?: string | null): string {
    if (!value) return ''
    const opt = categories.value.find((c) => c.value === value)
    return opt ? t(opt.i18nKey) : value
  }

  function navigatePreview(item: DashboardTemplate) {
    router.push(`/preview-template/${item.id}`)
  }

  /** 页面初始化：并行拉取模板列表与分类枚举 */
  function init() {
    void loadList()
    void loadCategories()
  }

  return {
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
    applyVisible,
    applying,
    applyTarget,
    openApply,
    confirmApply,
    openCreate,
    openEdit,
    handleCommand,
    handleSearch,
    categoryLabel,
    navigatePreview,
    init,
  }
}

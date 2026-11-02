import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useLinkageStore } from '@/stores/linkage'

export interface UsePreviewSessionOptions {
  /** 模板加载成功后生成缩略图 */
  onTemplateLoaded?: (templateId: number) => void
}

/**
 * 🔑 预览页会话：路由参数解析、看板/模板加载、刷新与返回。
 *   页面骨架与工具栏由调用方组合。
 */
export function usePreviewSession(options: UsePreviewSessionOptions = {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useBiEditorStore()
  const linkageStore = useLinkageStore()

  const loading = ref(false)
  const loadError = ref('')
  const refreshing = ref(false)
  const lastRefreshAt = ref<Date | null>(null)

  /** 手动 / 自动刷新（自动刷新传入 silent） */
  async function handleRefresh(silent = false) {
    if (refreshing.value) return
    refreshing.value = true
    try {
      await store.refreshAllData()
      lastRefreshAt.value = new Date()
      void silent
    } catch (e) {
      console.error('[Preview] 刷新失败:', e)
    } finally {
      refreshing.value = false
    }
  }

  function handleBack() {
    const isTemplate = route.name === 'PreviewTemplate'
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(isTemplate ? '/dashboard-templates' : '/dashboard')
    }
  }

  onMounted(async () => {
    // 🔑 预览页开启图表点击联动/钻取（编辑器内关闭，避免与选中交互冲突）
    linkageStore.setLinkageEnabled(true)
    const id = Number(route.params.id)
    const isTemplate = route.name === 'PreviewTemplate'
    if (!id || Number.isNaN(id)) {
      loadError.value = isTemplate ? '模板 ID 无效' : '看板 ID 无效'
      return
    }
    loading.value = true
    try {
      if (isTemplate) {
        await store.loadTemplate(id)
        options.onTemplateLoaded?.(id)
      } else {
        await store.loadDashboard(id)
      }
      lastRefreshAt.value = new Date()
    } catch {
      loadError.value = isTemplate
        ? '模板加载失败，可能已被删除或无访问权限'
        : '看板加载失败，可能已被删除或无访问权限'
    } finally {
      loading.value = false
    }
  })

  onUnmounted(() => {
    linkageStore.setLinkageEnabled(false)
  })

  return {
    store,
    loading,
    loadError,
    refreshing,
    lastRefreshAt,
    handleRefresh,
    handleBack,
  }
}

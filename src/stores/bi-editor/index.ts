import { defineStore } from 'pinia'
import { nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { ComponentInstance, CanvasState, GuideLine, DashboardLayout } from '@/views/bi-editor/types'
import { getMeta, CATEGORY_GROUPS, CATEGORY_LABELS } from './metadata'
import { useHistory } from './history'
import { useComponentOperations } from './use-components'
import { useCanvasOperations } from './use-canvas'
import { DEFAULT_ZOOM, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'
import { createDashboard, updateDashboard, getDashboardDetail } from '@/api/dashboard'

export const useBiEditorStore = defineStore('bi-editor', () => {
  // ========== 共享状态 ==========
  const canvas = ref<CanvasState>({
    width: 1920,
    height: 1080,
    zoom: DEFAULT_ZOOM,
    backgroundColor: '#FFFFFF',
    backgroundImage: '',
    showGrid: true,
    gridSize: 10,
    snapToGrid: true,
    showRuler: true,
    showGuides: true,
    scrollX: DEFAULT_VIEWPORT_OFFSET.x,
    scrollY: DEFAULT_VIEWPORT_OFFSET.y,
  })

  const components = ref<ComponentInstance[]>([])
  const selectedId = ref<string | null>(null)
  const guides = ref<GuideLine[]>([])

  // ========== 历史记录 ==========
  const { pushHistory, undo, redo, canUndo, canRedo, clearHistory, isRestoringNow } = useHistory(
    components,
    canvas,
    guides,
    selectedId,
  )

  // ========== 组件操作 ==========
  const {
    selectedComponent,
    layerList,
    addComponent,
    updateComponent,
    moveComponent,
    resizeComponent,
    setComponentZIndex,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    removeComponent,
    duplicateComponent,
    toggleVisibility,
    toggleLock,
    selectComponent,
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
  } = useComponentOperations(components, selectedId, pushHistory)

  // ========== 画布操作 ==========
  const {
    updateCanvas,
    setZoom,
    addGuide,
    setGuides,
    setGuidesSilent,
    clearGuides,
    resetViewport,
  } = useCanvasOperations(canvas, guides, pushHistory)

  // ========== 看板会话状态 ==========
  const currentDashboardId = ref<number | null>(null) // null = 新建未保存
  const dashboardName = ref('未命名报表')
  const isDirty = ref(false) // 是否有未保存的改动
  const isSaving = ref(false)
  const isLoading = ref(false)

  // 🔑 数据刷新键:每次 refreshAllData 递增,CanvasArea 用它拼接 :key 强制组件重挂载 → 重新取数
  const refreshKey = ref(0)

  /**
   * 序列化当前编辑器状态为可持久化的 DashboardLayout。
   * 视口状态(zoom/scrollX/scrollY)不持久化,加载时由 resetViewport 还原。
   * 使用 JSON.parse(JSON.stringify(...)) 剥离 Vue 响应式 Proxy(与 history.ts 思路一致)。
   */
  function serializeLayout(): DashboardLayout {
    return {
      version: '1.0',
      canvas: {
        ...canvas.value,
        // 视口状态不持久化,用默认值占位,加载时 resetViewport 会覆盖
        zoom: DEFAULT_ZOOM,
        scrollX: DEFAULT_VIEWPORT_OFFSET.x,
        scrollY: DEFAULT_VIEWPORT_OFFSET.y,
      },
      components: JSON.parse(JSON.stringify(components.value)),
      guides: JSON.parse(JSON.stringify(guides.value)),
    }
  }

  /**
   * 将 DashboardLayout 应用到当前编辑器状态。
   * 通过 isLoading 标志拦截脏状态检测 watch,避免恢复过程被误判为用户改动。
   * 🔑 迁移逻辑:老看板的 ComponentInstance 没有 dataSource/dataConfig 字段,统一补默认值。
   */
  function applyLayout(layout: DashboardLayout) {
    isLoading.value = true
    // 迁移组件:给老组件补 dataSource/dataConfig 默认值(向后兼容)
    components.value = (layout.components ?? []).map((c) => ({
      ...c,
      dataSource: c.dataSource ?? { datasetId: null },
      dataConfig: c.dataConfig ?? {},
    }))
    canvas.value = { ...canvas.value, ...layout.canvas }
    guides.value = layout.guides ?? []
    selectedId.value = null
    clearHistory()
    resetViewport()
    // nextTick 后重置标志:确保 watch 的 deep 回调(微任务)先跑完再放开
    nextTick(() => {
      isLoading.value = false
      isDirty.value = false
    })
  }

  /** 加载已有看板 */
  async function loadDashboard(id: number) {
    try {
      const res = await getDashboardDetail(id)
      currentDashboardId.value = id
      dashboardName.value = res.data.name
      const layout = (res.data.layout ?? {
        version: '1.0',
        components: [],
        canvas: canvas.value,
        guides: [],
      }) as unknown as DashboardLayout
      applyLayout(layout)
    } catch (e) {
      // applyLayout 未执行时手动重置 isLoading,避免标志卡死
      isLoading.value = false
      throw e
    }
  }

  /** 保存看板:新建调 create,已有调 update */
  async function saveDashboard() {
    if (isSaving.value) return
    isSaving.value = true
    try {
      const payload = {
        name: dashboardName.value,
        layout: serializeLayout() as unknown as Record<string, unknown>,
      }
      if (currentDashboardId.value === null) {
        const res = await createDashboard(payload)
        currentDashboardId.value = res.data.id
      } else {
        await updateDashboard(currentDashboardId.value, payload)
      }
      isDirty.value = false
      ElMessage.success('保存成功')
    } finally {
      isSaving.value = false
    }
  }

  /** 新建空白看板 */
  function newDashboard() {
    isLoading.value = true
    currentDashboardId.value = null
    dashboardName.value = '未命名报表'
    components.value = []
    guides.value = []
    selectedId.value = null
    clearHistory()
    resetViewport()
    nextTick(() => {
      isLoading.value = false
      isDirty.value = false
    })
  }

  /**
   * 🔑 刷新所有图表数据 (预览/分享页场景):
   * 1. 清除 useDatasetBinding 模块级缓存
   * 2. 递增 refreshKey → CanvasArea :key 变化 → 组件重挂载 → 重新取数
   * 延迟 import 避免循环依赖。
   */
  async function refreshAllData() {
    const { clearAllDatasetCache } = await import('@/views/bi-editor/composables/useDatasetBinding')
    clearAllDatasetCache()
    refreshKey.value++
  }

  /**
   * 脏状态检测:任何对 components/canvas/guides 的改动都标记未保存。
   * 仅拦截 isLoading(加载/恢复期间),不拦截 isRestoringNow ——
   * undo/redo 也算未保存改动,应当标 dirty。
   */
  watch(
    [components, canvas, guides],
    () => {
      if (!isLoading.value) isDirty.value = true
    },
    { deep: true },
  )

  // ========== 导出 ==========
  return {
    // 状态
    canvas,
    components,
    selectedId,
    selectedComponent,
    layerList,
    guides,
    // 元数据
    getMeta,
    CATEGORY_GROUPS,
    CATEGORY_LABELS,
    // 组件方法
    addComponent,
    updateComponent,
    moveComponent,
    resizeComponent,
    setComponentZIndex,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    removeComponent,
    duplicateComponent,
    toggleVisibility,
    toggleLock,
    selectComponent,
    // 层级操作状态
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
    // 画布方法
    updateCanvas,
    setZoom,
    resetViewport,
    // 辅助线方法
    addGuide,
    setGuides,
    setGuidesSilent,
    clearGuides,
    // 历史方法
    undo,
    redo,
    canUndo,
    canRedo,
    pushHistory,
    clearHistory,
    isRestoringNow,
    // 看板会话状态
    currentDashboardId,
    dashboardName,
    isDirty,
    isSaving,
    isLoading,
    refreshKey,
    // 看板持久化方法
    serializeLayout,
    applyLayout,
    loadDashboard,
    saveDashboard,
    newDashboard,
    refreshAllData,
  }
})

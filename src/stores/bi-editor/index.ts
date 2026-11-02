import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentInstance, CanvasState, GuideLine } from '@/views/bi-editor/types'
import { getMeta, CATEGORY_GROUPS, CATEGORY_LABELS } from './metadata'
import { useHistory } from './history'
import { useComponentOperations } from './use-components'
import { useCanvasOperations } from './use-canvas'
import { createEditorSession } from './editor-session'
import { createCanvasExport } from './canvas-export'
import { createClipboard } from './clipboard'
import { createCanvasAlign } from './canvas-align'
import { DEFAULT_ZOOM, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'

export type { EditorDraft } from './editor-session'

/**
 * 🔑 BI 编辑器 Store —— 组合根。
 *
 *   具体职责已按领域拆分到同目录模块：
 *   - `history.ts`         撤销/重做
 *   - `use-components.ts`  组件增删改查 / 选择 / 层级 / 分组 / 对齐（内部再拆组件操作模块）
 *   - `use-canvas.ts`      画布与辅助线
 *   - `editor-session.ts`  看板/模板的加载保存、本地草稿、布局序列化
 *   - `canvas-export.ts`   PNG/PDF 导出与缩略图
 *   - `clipboard.ts`       组件复制/粘贴
 *   - `canvas-align.ts`    单选时按画布尺寸对齐的包装
 *
 *   ⚠️ 对外返回对象键必须与拆分前完全一致，外部 20+ 处 `store.xxx()` 依赖该契约。
 */
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
  // 🔑 多选状态：选中 ID 的集合。selectedId 是「主选中」（最后被选中的组件，用于右键菜单、Delete 删除目标）
  //   使用数组而非 Set：Vue 3 对 ref<Set> 的 .has() 在 Pinia setup store 中的响应式追踪不够可靠，
  //   数组的 .includes() 在模板中能被正确追踪。
  const selectedIds = ref<string[]>([])
  const guides = ref<GuideLine[]>([])

  // ========== 看板会话状态 ==========
  const currentDashboardId = ref<number | null>(null) // null = 新建未保存
  /** 🔑 乐观锁版本号：加载/保存成功后更新，保存时回传后端做并发冲突检测 */
  const dashboardVersion = ref<number | null>(null)
  const dashboardName = ref('未命名报表')
  const isDirty = ref(false) // 是否有未保存的改动
  const isSaving = ref(false)
  const isLoading = ref(false)
  /** 🔑 模板编辑模式：保存时走模板接口而非看板接口 */
  const isTemplateMode = ref(false)
  const currentTemplateId = ref<number | null>(null) // null = 新建模板未保存
  /** 🔑 模板元数据（编辑模式预填、保存时回写，保持 dialog 预填一致） */
  const templateDescription = ref('')
  const templateCategory = ref<string | undefined>(undefined)
  const templateIsPublic = ref(true)
  const isExportingPng = ref(false)

  // ========== 历史记录 ==========
  const {
    pushHistory: rawPushHistory,
    undo: rawUndo,
    redo: rawRedo,
    canUndo,
    canRedo,
    clearHistory,
    isRestoringNow,
  } = useHistory(components, canvas, guides, selectedId, selectedIds)

  /**
   * 🔑 标记未保存改动（替代旧版 deep watch）。
   * 旧版用 watch([components, canvas, guides], cb, { deep: true }) 检测改动，
   * deep watch 每次属性变更都要遍历整个 components 数组的所有属性，开销大。
   * 现在改为在所有 mutation 函数中手动调用 markDirty()，只做一次布尔赋值。
   */
  function markDirty() {
    if (!isLoading.value) isDirty.value = true
  }

  // 🔑 包装 pushHistory：同时标记 dirty（所有调用 pushHistory 的操作都是用户改动）
  function pushHistory() {
    rawPushHistory()
    markDirty()
  }

  // 🔑 包装 undo/redo：撤销/重做也算未保存改动
  function undo() {
    rawUndo()
    markDirty()
  }
  function redo() {
    rawRedo()
    markDirty()
  }

  // ========== 组件操作 ==========
  const componentOps = useComponentOperations(
    components,
    selectedId,
    pushHistory,
    markDirty,
    selectedIds,
  )
  const {
    selectedComponent,
    selectedComponents,
    selectedIdSet,
    layerList,
    // 🔑 分组包围盒 & 命中测试（统一 GroupBox 边框 + 空白区整体拖拽）
    selectedGroupBounds,
    isInSelectedGroup,
    hitTestSelectedGroupBlank,
    isCommittingGroupDragNow,
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
    selectComponentAccum,
    selectByRect,
    clearSelection,
    // 🔑 O(1) 组件查找（Map 索引）
    getComponent,
    // 🔑 分组拖拽预览
    groupDragPreview,
    activeDragGroupId,
    activeDragId,
    setDragPreview,
    commitGroupDrag,
    abortGroupDrag,
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
    // 分组
    canGroup,
    canUngroup,
    groupSelection,
    ungroupSelection,
    // 对齐 / 分布（单选时由 canvas-align 覆盖四个居中/右/下方向）
    alignLeft,
    alignTop,
    distributeHorizontal,
    distributeVertical,
  } = componentOps

  // ========== 画布操作 ==========
  const {
    updateCanvas,
    setZoom,
    addGuide,
    removeGuide,
    setGuides,
    setGuidesSilent,
    clearGuides,
    resetViewport,
  } = useCanvasOperations(canvas, guides, pushHistory, markDirty)

  // ========== 画布导出（PNG / PDF / 缩略图） ==========
  const {
    registerExportPng,
    exportCanvasAsPng,
    exportCanvasAsPdf,
    captureThumbnail,
  } = createCanvasExport({ dashboardName, isExportingPng })

  // ========== 看板 / 模板会话 ==========
  const {
    setDashboardId,
    setDashboardName,
    serializeLayout,
    applyLayout,
    loadDashboard,
    saveDashboard,
    saveDraft,
    loadDraft,
    clearDraft,
    restoreDraft,
    newDashboard,
    newTemplate,
    loadTemplate,
    saveTemplate,
  } = createEditorSession({
    canvas,
    components,
    guides,
    selectedId,
    isLoading,
    isDirty,
    isSaving,
    currentDashboardId,
    dashboardVersion,
    dashboardName,
    isTemplateMode,
    currentTemplateId,
    templateDescription,
    templateCategory,
    templateIsPublic,
    clearHistory,
    resetViewport,
    captureThumbnail,
  })

  // ========== 剪贴板 ==========
  const { copyToClipboard, pasteFromClipboard } = createClipboard({
    components,
    selectedId,
    selectedIds,
    pushHistory,
  })

  // ========== 画布感知的对齐包装（单选按画布尺寸） ==========
  const {
    alignHCenter,
    alignRight,
    alignVCenter,
    alignBottom,
  } = createCanvasAlign({
    canvas,
    components,
    selectedId,
    selectedIds,
    pushHistory,
    ops: componentOps,
  })

  /**
   * 🔑 刷新所有图表数据 (预览/分享页场景):
   * 1. 清除 useDatasetBinding 模块级缓存
   * 2. 递增 refreshSignal → 所有 useDatasetBinding 实例自动重新取数
   *    （替代旧的 refreshKey + v-for key 强制重挂载，避免 ECharts/VDR/ResizeObserver 全部重新初始化）
   * 延迟 import 避免循环依赖。
   */
  async function refreshAllData() {
    const { clearAllDatasetCache, triggerDatasetRefresh } = await import(
      '@/views/bi-editor/composables/useDatasetBinding'
    )
    clearAllDatasetCache()
    triggerDatasetRefresh()
  }

  // ========== 导出 ==========
  return {
    // 状态
    canvas,
    components,
    selectedId,
    selectedIds,
    selectedComponent,
    selectedComponents,
    selectedIdSet,
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
    selectComponentAccum,
    selectByRect,
    clearSelection,
    // 🔑 O(1) 组件查找（Map 索引）
    getComponent,
    // 🔑 分组包围盒 & 命中测试（统一 GroupBox 边框 + 空白区整体拖拽）
    selectedGroupBounds,
    isInSelectedGroup,
    hitTestSelectedGroupBlank,
    isCommittingGroupDragNow,
    // 🔑 分组拖拽预览（必须暴露给画布层使用：store.groupDragPreview 喂给 CanvasComponentItem，
    //   store.commitGroupDrag 在 dragstop 提交，store.abortGroupDrag 在纯点击/拉伸/恢复时清空）
    groupDragPreview,
    activeDragGroupId,
    activeDragId,
    setDragPreview,
    commitGroupDrag,
    abortGroupDrag,
    // 对齐 / 分布
    alignLeft,
    alignHCenter,
    alignRight,
    alignTop,
    alignVCenter,
    alignBottom,
    distributeHorizontal,
    distributeVertical,
    // 分组 / 取消分组
    canGroup,
    canUngroup,
    groupSelection,
    ungroupSelection,
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
    removeGuide,
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
    // 剪贴板方法
    copyToClipboard,
    pasteFromClipboard,
    // 看板会话状态
    currentDashboardId,
    dashboardVersion,
    setDashboardId,
    dashboardName,
    setDashboardName,
    isDirty,
    markDirty,
    isSaving,
    isLoading,
    // 本地草稿
    saveDraft,
    loadDraft,
    clearDraft,
    restoreDraft,
    // 看板持久化方法
    serializeLayout,
    applyLayout,
    loadDashboard,
    saveDashboard,
    newDashboard,
    newTemplate,
    loadTemplate,
    saveTemplate,
    isTemplateMode,
    currentTemplateId,
    templateDescription,
    templateCategory,
    templateIsPublic,
    captureThumbnail,
    refreshAllData,
    // 画布导出 PNG / PDF
    isExportingPng,
    registerExportPng,
    exportCanvasAsPng,
    exportCanvasAsPdf,
  }
})

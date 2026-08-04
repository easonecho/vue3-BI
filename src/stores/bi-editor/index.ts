import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentInstance, CanvasState, GuideLine } from '@/views/bi-editor/types'
import { getMeta, CATEGORY_GROUPS, CATEGORY_LABELS } from './metadata'
import { useHistory } from './history'
import { useComponentOperations } from './use-components'
import { useCanvasOperations } from './use-canvas'

export const useBiEditorStore = defineStore('bi-editor', () => {
  // ========== 共享状态 ==========
  const canvas = ref<CanvasState>({
    width: 1920,
    height: 1080,
    zoom: 1,
    backgroundColor: '#FFFFFF',
    backgroundImage: '',
    showGrid: true,
    gridSize: 10,
    snapToGrid: true,
    showRuler: true,
    showGuides: true,
    scrollX: 0,
    scrollY: 0,
  })

  const components = ref<ComponentInstance[]>([])
  const selectedId = ref<string | null>(null)
  const guides = ref<GuideLine[]>([])

  // ========== 历史记录（依赖共享状态） ==========
  const { pushHistory, undo, redo, canUndo, canRedo, clearHistory } = useHistory(
    components,
    canvas,
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
  } = useComponentOperations(components, selectedId, pushHistory)

  // ========== 画布操作 ==========
  const { updateCanvas, setZoom, addGuide, setGuides, setGuidesSilent, clearGuides } =
    useCanvasOperations(canvas, guides, pushHistory)

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
    // 画布方法
    updateCanvas,
    setZoom,
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
  }
})

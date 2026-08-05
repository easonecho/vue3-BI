import type { Ref } from 'vue'
import type { CanvasState, GuideLine } from '@/views/bi-editor/types'
import {
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  DEFAULT_VIEWPORT_OFFSET,
} from '@/views/bi-editor/constants/canvas-constants'

/** 画布操作 API（用于类型约束与文档） */
export interface CanvasOperationsApi {
  updateCanvas: (updates: Partial<CanvasState>) => void
  setZoom: (zoom: number) => void
  addGuide: (guide: Omit<GuideLine, 'id'>) => void
  setGuides: (guides: GuideLine[]) => void
  /** 仅更新辅助线，不写入历史（用于拖拽过程中的实时刷新） */
  setGuidesSilent: (guides: GuideLine[]) => void
  clearGuides: () => void
  /** 一键还原画布视口：缩放归 1:1、平移归默认偏移。不写入历史（视口状态不受历史管辖） */
  resetViewport: () => void
}

export function useCanvasOperations(
  canvas: Ref<CanvasState>,
  guides: Ref<GuideLine[]>,
  pushHistory: () => void,
) {
  function updateCanvas(updates: Partial<CanvasState>) {
    canvas.value = { ...canvas.value, ...updates }
    pushHistory()
  }

  function setZoom(zoom: number) {
    const clamped = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM)
    canvas.value.zoom = Math.round(clamped * 100) / 100
  }

  function addGuide(guide: Omit<GuideLine, 'id'>) {
    guides.value.push({ ...guide, id: `guide_${Date.now()}` })
    pushHistory()
  }

  function setGuides(newGuides: GuideLine[]) {
    guides.value = [...newGuides]
    pushHistory()
  }

  function setGuidesSilent(newGuides: GuideLine[]) {
    guides.value = [...newGuides]
  }

  function clearGuides() {
    guides.value = []
    pushHistory()
  }

  /**
   * 一键还原画布视口：缩放重置为 1:1，平移重置为默认偏移。
   * 🔑 视口状态（zoom / scrollX / scrollY）不受历史记录管辖，因此此处不调用 pushHistory。
   *    useCanvasTransform 中的 watcher 会监听 canvas.zoom / scrollX / scrollY 变化并同步到
   *    localScale / localOffset，从而驱动 transform 层与标尺刷新。
   */
  function resetViewport() {
    canvas.value.zoom = DEFAULT_ZOOM
    canvas.value.scrollX = DEFAULT_VIEWPORT_OFFSET.x
    canvas.value.scrollY = DEFAULT_VIEWPORT_OFFSET.y
  }

  return {
    updateCanvas,
    setZoom,
    addGuide,
    setGuides,
    setGuidesSilent,
    clearGuides,
    resetViewport,
  }
}

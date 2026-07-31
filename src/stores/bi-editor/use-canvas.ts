import type { Ref } from 'vue'
import type { CanvasState, GuideLine } from '@/views/bi-editor/types'

/** 画布操作 API（用于类型约束与文档） */
export interface CanvasOperationsApi {
  updateCanvas: (updates: Partial<CanvasState>) => void
  setZoom: (zoom: number) => void
  addGuide: (guide: Omit<GuideLine, 'id'>) => void
  setGuides: (guides: GuideLine[]) => void
  clearGuides: () => void
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
    const clamped = Math.min(Math.max(zoom, 0.1), 5)
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

  function clearGuides() {
    guides.value = []
    pushHistory()
  }

  return {
    updateCanvas,
    setZoom,
    addGuide,
    setGuides,
    clearGuides,
  }
}

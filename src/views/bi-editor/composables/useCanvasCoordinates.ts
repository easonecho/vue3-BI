import type { Ref } from 'vue'

export interface UseCanvasCoordinatesDeps {
  viewportRef: Ref<HTMLElement | null>
  screenToWorld: (sx: number, sy: number) => { x: number; y: number }
}

/** 屏幕坐标 → 世界坐标，带 viewport rect 缓存（避免 mousemove 期间反复强制布局） */
export function useCanvasCoordinates(deps: UseCanvasCoordinatesDeps) {
  const { viewportRef, screenToWorld } = deps
  let cachedViewportRect: DOMRect | null = null

  /** 交互开始时刷新缓存 */
  function refreshViewportRect() {
    cachedViewportRect = viewportRef.value?.getBoundingClientRect() ?? null
  }

  function clientToWorld(clientX: number, clientY: number) {
    const rect = cachedViewportRect ?? viewportRef.value?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return screenToWorld(clientX - rect.left, clientY - rect.top)
  }

  return { clientToWorld, refreshViewportRect }
}

import { reactive } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { SNAP_THRESHOLD } from '@/views/bi-editor/constants/canvas-constants'

export type RectLike = { left: number; top: number; width: number; height: number }
type AnchorNameX = 'left' | 'centerX' | 'right'
type AnchorNameY = 'top' | 'centerY' | 'bottom'
type Anchors = Record<AnchorNameX | AnchorNameY, number>

export type SnapResult = {
  rect: { left: number; top: number; width: number; height: number }
  hitsX: number[]
  hitsY: number[]
}

/**
 * Smart Guides (component drag-to-align snap lines) composable.
 * Coordinates are in business-space relative to canvas-sheet origin (0,0 = canvas-sheet top-left,
 * matches component x/y values), so they participate in transform-layer zoom/pan exactly the
 * same way as components do.
 */
export function useSmartGuides() {
  const store = useBiEditorStore()

  /** Currently-active snap alignment lines rendered on top of canvas-sheet during drag/resize interactions. */
  const snapLines = reactive<{
    vertical: number[]
    horizontal: number[]
  }>({ vertical: [], horizontal: [] })

  /**
   * 🔑 拖拽会话级缓存：同一次拖拽过程中，被排除的组件 ID 不变，其他组件位置不变，
   *   所以吸附目标集合只需在首次调用时计算一次，后续 mousemove 直接复用缓存。
   *   拖拽结束后（handleVdrDragstop）调用 resetSnapCache() 清除缓存。
   */
  let snapTargetCache: {
    excludeId: string
    targetsX: number[]
    targetsY: number[]
  } | null = null

  /** 🔑 性能优化：RAF 批量更新吸附线，避免每次 mousemove 触发响应式更新 */
  let snapRafId: number | null = null
  let pendingSnapHits = { x: [] as number[], y: [] as number[] }

  /** Clear currently-displayed alignment snap lines */
  function clearSnapLines() {
    // 🔑 取消 pending rAF，避免延迟更新覆盖清除
    if (snapRafId !== null) {
      cancelAnimationFrame(snapRafId)
      snapRafId = null
    }
    pendingSnapHits = { x: [], y: [] }
    if (snapLines.vertical.length) snapLines.vertical.length = 0
    if (snapLines.horizontal.length) snapLines.horizontal.length = 0
  }

  /** 🔑 RAF 批量更新：合并同一帧内的多次 mousemove 调用为一次响应式更新 */
  function applySnapLines(hitsX: number[], hitsY: number[]) {
    pendingSnapHits = { x: hitsX, y: hitsY }
    if (snapRafId !== null) return // 已有 pending rAF，只更新缓存
    snapRafId = requestAnimationFrame(() => {
      snapRafId = null
      snapLines.vertical.length = 0
      snapLines.horizontal.length = 0
      pendingSnapHits.x.forEach((x) => snapLines.vertical.push(x))
      pendingSnapHits.y.forEach((y) => snapLines.horizontal.push(y))
    })
  }

  /** Extract the 6 alignment anchors of a rectangle in business-space (same as component x/y). */
  function getAnchors(rect: RectLike): Anchors {
    return {
      left: rect.left,
      centerX: rect.left + rect.width / 2,
      right: rect.left + rect.width,
      top: rect.top,
      centerY: rect.top + rect.height / 2,
      bottom: rect.top + rect.height,
    }
  }

  /**
   * Collect candidate target anchors:
   *  - Canvas sheet edges + center (vertical: x=0 / w/2 / w; horizontal: y=0 / h/2 / h)
   *  - All 6 anchors of every OTHER component (non-locked, visible) in the canvas.
   *
   * 🔑 性能优化：同一次拖拽中 excludeId 不变且其他组件位置不变，
   *   首次计算后缓存结果，后续直接复用，避免每次 mousemove 都遍历全部组件。
   */
  function collectSnapTargets(excludeId: string) {
    if (snapTargetCache && snapTargetCache.excludeId === excludeId) {
      return snapTargetCache
    }

    const xSet = new Set<number>()
    const ySet = new Set<number>()
    xSet.add(0)
    xSet.add(store.canvas.width / 2)
    xSet.add(store.canvas.width)
    ySet.add(0)
    ySet.add(store.canvas.height / 2)
    ySet.add(store.canvas.height)
    for (const c of store.components) {
      if (c.id === excludeId || c.locked || !c.visible) continue
      const a = getAnchors({ left: c.x, top: c.y, width: c.width, height: c.height })
      xSet.add(a.left)
      xSet.add(a.centerX)
      xSet.add(a.right)
      ySet.add(a.top)
      ySet.add(a.centerY)
      ySet.add(a.bottom)
    }
    const result = { excludeId, targetsX: [...xSet], targetsY: [...ySet] }
    snapTargetCache = result
    return result
  }

  /** 🔑 重置吸附目标缓存：拖拽/拉伸结束后调用，确保下次拖拽使用最新组件位置 */
  function resetSnapCache() {
    snapTargetCache = null
  }

  /** Find the nearest target within SNAP_THRESHOLD of a source anchor. */
  function nearestSnap(
    src: number,
    targets: number[],
    threshold = SNAP_THRESHOLD,
  ): { snapped: boolean; value: number; diff: number; target: number | null } {
    let best = src
    let bestDiff = Infinity
    let bestTarget: number | null = null
    for (const t of targets) {
      const d = Math.abs(src - t)
      if (d <= threshold && d < bestDiff) {
        bestDiff = d
        best = t
        bestTarget = t
      }
    }
    return { snapped: bestTarget != null, value: best, diff: bestDiff, target: bestTarget }
  }

  /**
   * Run snap-to-align against a dragged rectangle. Returns a NEW rectangle with position possibly
   * snapped to nearest alignment anchor, plus the X/Y coordinates of alignment lines to render.
   * Priority rule: each axis keeps only the single closest anchor match (prevents jitter when
   * the dragged rectangle simultaneously straddles multiple candidates).
   */
  function snapRectToGuides(id: string, rect: RectLike, threshold = SNAP_THRESHOLD): SnapResult {
    const hitsX: number[] = []
    const hitsY: number[] = []
    const src = getAnchors(rect)
    const { targetsX, targetsY } = collectSnapTargets(id)

    let bestX: { anchor: AnchorNameX; target: number; diff: number } | null = null
    for (const anchor of ['left', 'centerX', 'right'] as const) {
      const r = nearestSnap(src[anchor], targetsX, threshold)
      if (r.snapped && r.target != null && (bestX == null || r.diff < bestX.diff)) {
        bestX = { anchor, target: r.target, diff: r.diff }
      }
    }
    let bestY: { anchor: AnchorNameY; target: number; diff: number } | null = null
    for (const anchor of ['top', 'centerY', 'bottom'] as const) {
      const r = nearestSnap(src[anchor], targetsY, threshold)
      if (r.snapped && r.target != null && (bestY == null || r.diff < bestY.diff)) {
        bestY = { anchor, target: r.target, diff: r.diff }
      }
    }

    let { left, top } = rect
    if (bestX) {
      const offsetFromLeft =
        bestX.anchor === 'left' ? 0 : bestX.anchor === 'centerX' ? rect.width / 2 : rect.width
      left = bestX.target - offsetFromLeft
      hitsX.push(bestX.target)
    }
    if (bestY) {
      const offsetFromTop =
        bestY.anchor === 'top' ? 0 : bestY.anchor === 'centerY' ? rect.height / 2 : rect.height
      top = bestY.target - offsetFromTop
      hitsY.push(bestY.target)
    }

    return {
      rect: { left, top, width: rect.width, height: rect.height },
      hitsX,
      hitsY,
    }
  }

  return {
    snapLines,
    clearSnapLines,
    applySnapLines,
    snapRectToGuides,
    resetSnapCache,
  }
}

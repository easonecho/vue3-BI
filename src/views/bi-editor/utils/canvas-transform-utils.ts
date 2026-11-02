import type { Ref } from 'vue'
import {
  RULER_SIZE,
  DISPLAY_OFFSET,
  MIN_ZOOM,
  MAX_ZOOM,
} from '@/views/bi-editor/constants/canvas-constants'

export interface CanvasOffset {
  x: number
  y: number
}

/** 限制缩放范围 */
export function clampZoom(next: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next))
}

/** 屏幕坐标 → 画布世界坐标 */
export function screenToWorldPoint(
  sx: number,
  sy: number,
  scale: number,
  offset: CanvasOffset,
): CanvasOffset {
  return {
    x: (sx - offset.x) / scale,
    y: (sy - offset.y) / scale,
  }
}

/**
 * 以指定屏幕点为锚点缩放：返回新的缩放值与平移偏移。
 */
export function zoomAtAnchor(
  clampedScale: number,
  anchor: { screenX: number; screenY: number },
  previousScale: number,
  previousOffset: CanvasOffset,
): { scale: number; offset: CanvasOffset } {
  const before = screenToWorldPoint(anchor.screenX, anchor.screenY, previousScale, previousOffset)
  return {
    scale: clampedScale,
    offset: {
      x: anchor.screenX - before.x * clampedScale,
      y: anchor.screenY - before.y * clampedScale,
    },
  }
}

/** 画布布局样式（通过 --ruler 变量控制标尺占位） */
export function buildLayoutStyle(showRuler: boolean): Record<string, string> {
  const ruler = showRuler ? RULER_SIZE : 0
  return {
    '--ruler': `${ruler}px`,
  }
}

/** 外层 transform 层样式 */
export function buildTransformLayerStyle(scale: number, offset: CanvasOffset) {
  const tx = offset.x - DISPLAY_OFFSET * scale
  const ty = offset.y - DISPLAY_OFFSET * scale
  return {
    transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
    transformOrigin: '0 0',
    width: '0px',
    height: '0px',
  }
}

/** 内层 offset 层样式 */
export function buildOffsetLayerStyle() {
  return {
    transform: `translate(${DISPLAY_OFFSET}px, ${DISPLAY_OFFSET}px)`,
  }
}

export type CanvasOffsetRef = Ref<CanvasOffset>

import { ref, computed, watch, nextTick, onBeforeUnmount, type Ref } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { RULER_SIZE, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'
import { useCanvasPan } from './useCanvasPan'
import { useCanvasWheel } from './useCanvasWheel'
import {
  clampZoom,
  screenToWorldPoint,
  zoomAtAnchor,
  buildLayoutStyle,
  buildTransformLayerStyle,
  buildOffsetLayerStyle,
} from './canvas-transform-utils'

export interface UseCanvasTransformOptions {
  /** Extra callback invoked when the user presses Escape (e.g. to abort ongoing resize). */
  onEscape?: () => void
}

/**
 * Viewport transform management:
 *  - Viewport dimensions (ResizeObserver on container)
 *  - Zoom (localScale <-> store.canvas.zoom, cursor-anchored)
 *  - Pan (Space+drag / Middle-click drag / wheel scroll)
 *  - Coordinate conversion (screen <-> business-space)
 *  - Transform / offset layer computed styles
 *  - Layout grid computed style (ruler on/off sizing)
 */
export function useCanvasTransform(options: UseCanvasTransformOptions = {}) {
  const store = useBiEditorStore()

  // ========== DOM refs ==========
  const containerRef = ref<HTMLElement | null>(null)
  const viewportRef = ref<HTMLElement | null>(null)

  // ========== Viewport dimensions ==========
  const viewportWidth = ref(1400)
  const viewportHeight = ref(800)
  let resizeObserver: ResizeObserver | null = null

  // ========== Transform state ==========
  const localScale = ref(store.canvas.zoom)
  // 画布视图的默认平移偏移：决定 canvas-sheet 的业务 (0,0) 点相对于 viewport 左上角的屏幕距离
  const localOffset = ref({ ...DEFAULT_VIEWPORT_OFFSET })
  // 🔑 初始化立刻双向对齐，避免第一次历史快照存错偏移
  store.canvas.scrollX = localOffset.value.x
  store.canvas.scrollY = localOffset.value.y

  // ========== Pan mode state ==========
  const {
    isSpacePressed,
    isMiddlePressed,
    isPanning,
    startPan,
    abortPan,
    handleContainerMouseDown,
  } = useCanvasPan({
    localOffset,
    onEscape: options.onEscape,
  })

  // ========== Layout sizes (absolute positioning via CSS custom property) ==========
  const layoutStyle = computed(() => buildLayoutStyle(store.canvas.showRuler))

  const viewportStyle = {}

  // ========== Coordinate math ==========
  function screenToWorld(sx: number, sy: number) {
    return screenToWorldPoint(sx, sy, localScale.value, localOffset.value)
  }

  // ========== Transform layer style ==========
  const transformLayerStyle = computed(() =>
    buildTransformLayerStyle(localScale.value, localOffset.value),
  )
  const offsetLayerStyle = computed(() => buildOffsetLayerStyle())

  // ========== Scale sync (store <-> local) ==========
  watch(
    () => store.canvas.zoom,
    (val) => {
      if (Math.abs(val - localScale.value) > 0.001) {
        setZoomLocal(val)
      }
    },
  )

  // ========== Offset sync (store.canvas.scrollX/scrollY <-> localOffset) ==========
  // 🔑 撤销 / 重做后 restoreSnapshot 整体替换 canvas.value，需要双向同步视口偏移。
  let suppressOffsetSync = false
  // 🔑 字符串签名替代 deep watch
  watch(
    () => `${localOffset.value.x}_${localOffset.value.y}`,
    () => {
      if (suppressOffsetSync) return
      suppressOffsetSync = true
      try {
        store.canvas.scrollX = localOffset.value.x
        store.canvas.scrollY = localOffset.value.y
      } finally {
        suppressOffsetSync = false
      }
    },
  )
  watch(
    () => [store.canvas.scrollX, store.canvas.scrollY],
    ([x, y]) => {
      if (suppressOffsetSync) return
      const { x: lx, y: ly } = localOffset.value
      const DX = Math.abs((x as number) - lx)
      const DY = Math.abs((y as number) - ly)
      if (DX < 0.01 && DY < 0.01) return
      suppressOffsetSync = true
      try {
        localOffset.value = { x: x as number, y: y as number }
      } finally {
        suppressOffsetSync = false
      }
    },
  )

  function setZoomLocal(next: number, anchor?: { screenX: number; screenY: number }) {
    const clamped = clampZoom(next)
    const prev = localScale.value
    if (Math.abs(prev - clamped) < 0.0001) return
    if (anchor) {
      const nextView = zoomAtAnchor(clamped, anchor, prev, localOffset.value)
      localScale.value = nextView.scale
      localOffset.value = nextView.offset
    } else {
      localScale.value = clamped
    }
    if (Math.abs(clamped - store.canvas.zoom) > 0.001) {
      store.setZoom(clamped)
    }
  }

  // ========== Wheel: pan (unmodified) / zoom (Ctrl/Cmd+wheel) ==========
  const { handleWheel } = useCanvasWheel({
    viewportRef,
    localScale,
    localOffset,
    setZoomLocal,
  })

  /**
   * 重新计算 viewport 宽高。
   * ResizeObserver 只在容器尺寸真正变化时触发；切换 showRuler 时需主动调用。
   */
  function updateViewportDimensions(onResize?: () => void) {
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const totalW = rect.width
    const totalH = rect.height
    const ruler = store.canvas.showRuler ? RULER_SIZE : 0
    viewportWidth.value = Math.max(0, totalW - ruler)
    viewportHeight.value = Math.max(0, totalH - ruler)
    onResize?.()
  }

  function startViewportObserver(onResize?: () => void) {
    if (!containerRef.value) return
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const totalW = entry.contentRect.width
        const totalH = entry.contentRect.height
        const ruler = store.canvas.showRuler ? RULER_SIZE : 0
        viewportWidth.value = Math.max(0, totalW - ruler)
        viewportHeight.value = Math.max(0, totalH - ruler)
        onResize?.()
      }
    })
    resizeObserver.observe(containerRef.value)
    // 🔑 首次启动立刻测量一次，避免 mount 瞬间宽高还是默认值
    updateViewportDimensions(onResize)
  }

  // 标尺显示开关切换时容器自身尺寸不变，ResizeObserver 不会触发，需手动重算
  watch(
    () => store.canvas.showRuler,
    () => {
      updateViewportDimensions()
      nextTick(() => updateViewportDimensions())
    },
  )

  function stopViewportObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  onBeforeUnmount(() => {
    stopViewportObserver()
  })

  return {
    // DOM refs
    containerRef,
    viewportRef,
    // Viewport
    viewportWidth,
    viewportHeight,
    viewportStyle,
    layoutStyle,
    // Transform state
    localScale,
    localOffset,
    // Pan state
    isSpacePressed,
    isMiddlePressed,
    isPanning,
    // Math & styles
    screenToWorld,
    setZoomLocal,
    transformLayerStyle,
    offsetLayerStyle,
    // Event handlers (called from template / other composables)
    handleWheel,
    handleContainerMouseDown,
    startPan,
    abortPan,
    // Lifecycle helpers
    startViewportObserver,
    stopViewportObserver,
  }
}

export type UseCanvasTransformReturn = ReturnType<typeof useCanvasTransform>

/** Utility: pick another composable's ref without re-exporting the whole module. */
export function pickTransformRefs(t: UseCanvasTransformReturn) {
  return {
    localScale: t.localScale as Ref<number>,
    localOffset: t.localOffset,
    viewportWidth: t.viewportWidth,
    viewportHeight: t.viewportHeight,
    viewportRef: t.viewportRef,
  }
}

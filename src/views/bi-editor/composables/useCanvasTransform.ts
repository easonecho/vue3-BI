import { ref, computed, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import {
  RULER_SIZE,
  DISPLAY_OFFSET,
  MIN_ZOOM,
  MAX_ZOOM,
} from '@/views/bi-editor/constants/canvas-constants'

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
  const localOffset = ref({ x: 100, y: 100 })

  // ========== Pan mode state ==========
  const isSpacePressed = ref(false)
  const isMiddlePressed = ref(false)
  const isPanning = ref(false)
  let panStartPos = { x: 0, y: 0 }
  let panStartOffset = { x: 0, y: 0 }
  let panMouseMoveHandler: ((e: MouseEvent) => void) | null = null
  let panMouseUpHandler: ((e?: MouseEvent) => void) | null = null

  // ========== Layout sizes (for grid container) ==========
  const layoutStyle = computed(() => {
    const ruler = store.canvas.showRuler ? RULER_SIZE : 0
    return {
      gridTemplateColumns: `${ruler}px 1fr`,
      gridTemplateRows: `${ruler}px 1fr`,
    }
  })

  const viewportStyle = {}

  // ========== Coordinate math ==========
  function screenToWorld(sx: number, sy: number) {
    const s = localScale.value
    return {
      x: (sx - localOffset.value.x) / s,
      y: (sy - localOffset.value.y) / s,
    }
  }

  // ========== Transform layer style ==========
  const transformLayerStyle = computed(() => {
    const s = localScale.value
    const tx = localOffset.value.x - DISPLAY_OFFSET * s
    const ty = localOffset.value.y - DISPLAY_OFFSET * s
    return {
      transform: `translate3d(${tx}px, ${ty}px, 0) scale(${s})`,
      transformOrigin: '0 0',
      width: '0px',
      height: '0px',
    }
  })
  const offsetLayerStyle = computed(() => ({
    transform: `translate(${DISPLAY_OFFSET}px, ${DISPLAY_OFFSET}px)`,
  }))

  // ========== Scale sync (store <-> local) ==========
  watch(
    () => store.canvas.zoom,
    (val) => {
      if (Math.abs(val - localScale.value) > 0.001) {
        setZoomLocal(val)
      }
    },
  )

  function setZoomLocal(next: number, anchor?: { screenX: number; screenY: number }) {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next))
    const prev = localScale.value
    if (Math.abs(prev - clamped) < 0.0001) return
    if (anchor) {
      const before = screenToWorld(anchor.screenX, anchor.screenY)
      localScale.value = clamped
      const s = clamped
      localOffset.value = {
        x: anchor.screenX - before.x * s,
        y: anchor.screenY - before.y * s,
      }
    } else {
      localScale.value = clamped
    }
    if (Math.abs(clamped - store.canvas.zoom) > 0.001) {
      store.setZoom(clamped)
    }
  }

  // ========== Wheel: pan (unmodified) / zoom (Ctrl/Cmd+wheel) ==========
  function handleWheel(e: WheelEvent) {
    const viewport = viewportRef.value
    if (!viewport) return
    e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey || e.metaKey) {
      const rect = viewport.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const factor = Math.exp(-e.deltaY * 0.0015)
      setZoomLocal(localScale.value * factor, { screenX: sx, screenY: sy })
      return
    }

    const scrollSpeed = 1.5
    if (e.shiftKey) {
      localOffset.value = {
        ...localOffset.value,
        x: localOffset.value.x - e.deltaY * scrollSpeed,
      }
    } else {
      const hasSignificantHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      localOffset.value = {
        x: localOffset.value.x - (hasSignificantHorizontal ? e.deltaX : 0) * scrollSpeed,
        y: localOffset.value.y - (hasSignificantHorizontal ? 0 : e.deltaY) * scrollSpeed,
      }
    }
  }

  // ========== Pan mode (Space + drag or Middle-click drag) ==========
  function startPan(e: MouseEvent) {
    e.preventDefault()
    isPanning.value = true
    isMiddlePressed.value = e.button === 1 || isMiddlePressed.value
    panStartPos = { x: e.clientX, y: e.clientY }
    panStartOffset = { ...localOffset.value }

    panMouseMoveHandler = (ev: MouseEvent) => {
      if (!isPanning.value) return
      const deltaX = ev.clientX - panStartPos.x
      const deltaY = ev.clientY - panStartPos.y
      localOffset.value = {
        x: panStartOffset.x + deltaX,
        y: panStartOffset.y + deltaY,
      }
    }
    panMouseUpHandler = () => {
      isPanning.value = false
      isMiddlePressed.value = false
      if (panMouseMoveHandler) {
        document.removeEventListener('mousemove', panMouseMoveHandler)
        panMouseMoveHandler = null
      }
      if (panMouseUpHandler) {
        document.removeEventListener('mouseup', panMouseUpHandler)
        panMouseUpHandler = null
      }
    }
    document.addEventListener('mousemove', panMouseMoveHandler)
    document.addEventListener('mouseup', panMouseUpHandler)
  }

  function abortPan() {
    panMouseUpHandler?.()
  }

  function handleContainerMouseDown(e: MouseEvent) {
    if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
      startPan(e)
    }
  }

  // ========== Space key tracking ==========
  function handleKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName
    const isInput =
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      (e.target as HTMLElement)?.isContentEditable
    if (e.code === 'Space' && !e.repeat && !isInput) {
      isSpacePressed.value = true
      e.preventDefault()
    }
    if (e.code === 'Escape') {
      panMouseUpHandler?.()
      options.onEscape?.()
    }
  }
  function handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      isSpacePressed.value = false
    }
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
  }

  function stopViewportObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onBeforeUnmount(() => {
    stopViewportObserver()
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    if (panMouseMoveHandler) {
      document.removeEventListener('mousemove', panMouseMoveHandler)
    }
    if (panMouseUpHandler) {
      document.removeEventListener('mouseup', panMouseUpHandler)
    }
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

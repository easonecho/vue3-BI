import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import {
  RULER_SIZE,
  DISPLAY_OFFSET,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_VIEWPORT_OFFSET,
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
  // 画布视图的默认平移偏移：决定 canvas-sheet 的业务 (0,0) 点相对于 viewport 左上角的屏幕距离；
  // 同时决定标尺「0 刻度」对齐 viewport 边缘的偏移量（scale=1 时 rulerScrollPos = -localOffset）。
  // 🔑 取值来自 DEFAULT_VIEWPORT_OFFSET 常量，与 store init / resetViewport 共用同一份配置。
  const localOffset = ref({ ...DEFAULT_VIEWPORT_OFFSET })
  // 🔑 初始化立刻双向对齐：保证任何组件（含 history.clearHistory → createSnapshot）在读取
  //   store.canvas.scrollX / scrollY 时，值与 localOffset 完全一致，避免第一次快照存错偏移。
  store.canvas.scrollX = localOffset.value.x
  store.canvas.scrollY = localOffset.value.y

  // ========== Pan mode state ==========
  const isSpacePressed = ref(false)
  const isMiddlePressed = ref(false)
  const isPanning = ref(false)
  let panStartPos = { x: 0, y: 0 }
  let panStartOffset = { x: 0, y: 0 }
  let panMouseMoveHandler: ((e: MouseEvent) => void) | null = null
  let panMouseUpHandler: ((e?: MouseEvent) => void) | null = null

  // ========== Layout sizes (absolute positioning via CSS custom property) ==========
  const layoutStyle = computed(() => {
    const ruler = store.canvas.showRuler ? RULER_SIZE : 0
    // 🔑 不再使用 display:grid + grid-template（会被 v-if/v-show 子元素删除触发 grid 推断错误），
    //    改为通过 --ruler CSS 自定义变量控制所有子元素的绝对定位坐标。
    //    ruler=42 时 viewport 左上角在 (42,42)；ruler=0 时 viewport 顶满整个布局。
    return {
      '--ruler': `${ruler}px`,
    } as Record<string, string>
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

  // ========== Offset sync (store.canvas.scrollX/scrollY <-> localOffset) ==========
  //
  // 🔑 为什么需要：
  //   历史记录 snapshot.canvas 里包含 scrollX / scrollY（CanvasState 定义的字段）。
  //   restoreSnapshot 整体替换 canvas.value 后，scrollX/scrollY 会回到快照时刻的值，
  //   如果没有这段双向同步，localOffset（真实驱动 transform 平移的内部 ref）不会更新，
  //   表现为：撤销 / 重做后，组件回到了之前的位置，但视口没回去，用户找不到内容。
  //
  // 这里用「双 watcher + 阈值」模式：
  //   - localOffset 改 → 同步到 store.canvas.scrollX/scrollY（不写历史，因为 setZoomLocal 也不写）
  //   - store.canvas.scrollX/Y 改（例如 restoreSnapshot） → 同步回 localOffset（阈值判断避免死循环）
  let suppressOffsetSync = false
  watch(
    localOffset,
    (v) => {
      if (suppressOffsetSync) return
      suppressOffsetSync = true
      try {
        store.canvas.scrollX = v.x
        store.canvas.scrollY = v.y
      } finally {
        suppressOffsetSync = false
      }
    },
    { deep: true },
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

  /**
   * 重新计算 viewport 宽高。
   * 注意：ResizeObserver 只在「容器尺寸真正变化」时触发；
   * 当用户只是切换 showRuler（容器本身尺寸没变）时不会触发，
   * 必须主动调用该函数确保 viewportWidth/Height 同步。
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
    // 🔑 首次启动立刻测量一次（避免 mount 瞬间 viewportWidth/Height 还是默认的 1400/800）
    updateViewportDimensions(onResize)
  }

  // 当标尺显示开关切换时：grid 布局会变（ruler 列宽/行高在 42px ↔ 0px 之间切换），
  // 但 containerRef 自身尺寸没变，所以 ResizeObserver 不会触发，必须手动重算一次 viewport 尺寸，
  // 并在 nextTick 后重绘 rulers/guides 避免瞬间 0 宽高。
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

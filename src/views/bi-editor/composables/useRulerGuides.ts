import { ref, shallowRef, watch, nextTick, onBeforeUnmount } from 'vue'
import Guides from '@scena/guides'
import type { Ref } from 'vue'
import type { GuideLine } from '@/views/bi-editor/types'
import { useBiEditorStore } from '@/stores/bi-editor'
import {
  RULER_SIZE,
  RULER_BG_COLOR,
  RULER_LINE_COLOR,
  RULER_TEXT_COLOR,
  GUIDE_LINE_COLOR,
} from '@/views/bi-editor/constants/canvas-constants'

export interface UseRulerGuidesDeps {
  localScale: Ref<number>
  localOffset: Ref<{ x: number; y: number }>
  viewportWidth: Ref<number>
  viewportHeight: Ref<number>
  screenToWorld: (sx: number, sy: number) => { x: number; y: number }
}

/**
 * @scena/guides ruler + guideline management composable.
 * Handles creation / destruction / sync of horizontal + vertical Guides instances,
 * two-way binding with store.guides, and transform-driven refresh of ticks and markers.
 */
export function useRulerGuides(deps: UseRulerGuidesDeps) {
  const store = useBiEditorStore()
  const { localScale, localOffset, viewportWidth, viewportHeight, screenToWorld } = deps

  // ========== Refs to mount @scena/guides onto ==========
  const hGuidesRef = ref<HTMLElement | null>(null)
  const vGuidesRef = ref<HTMLElement | null>(null)
  const hGuides = shallowRef<Guides | null>(null)
  const vGuides = shallowRef<Guides | null>(null)

  /** During a live drag from @scena/guides, suppress history writes until mouse-up */
  let isGuidesDragging = false
  /** If business → library sync is in flight, ignore its own changeGuides echo */
  let isApplyingStoreGuides = false

  // ========== Ruler helpers ==========
  function rulerScrollPos(axis: 'x' | 'y') {
    const edgeScreenPx = 0
    const w = screenToWorld(axis === 'x' ? edgeScreenPx : 0, axis === 'y' ? edgeScreenPx : 0)
    return axis === 'x' ? w.x : w.y
  }

  function formatRulerLabel(value: number) {
    const rounded = Math.round(value)
    const abs = Math.abs(rounded)
    if (abs >= 1_000_000) return `${(rounded / 1_000_000).toFixed(0)}M`
    if (abs >= 10_000) return `${(rounded / 1_000).toFixed(0)}k`
    return `${rounded}`
  }

  function pickRulerUnit(zoom: number) {
    const target = 50 / zoom
    const pow = Math.pow(10, Math.floor(Math.log10(target)))
    const n = target / pow
    let mul = 1
    if (n < 2) mul = 1
    else if (n < 5) mul = 2
    else mul = 5
    return Math.max(1, mul * pow)
  }

  function commonGuidesOptions() {
    const zoom = localScale.value
    const unit = pickRulerUnit(zoom)
    return {
      backgroundColor: RULER_BG_COLOR,
      lineColor: RULER_LINE_COLOR,
      textColor: RULER_TEXT_COLOR,
      zoom,
      unit,
      textFormat: formatRulerLabel,
      segment: 5,
      negativeRuler: true,
      mainLineSize: '100%',
      longLineSize: 10,
      shortLineSize: 5,
      font: '11px sans-serif',
      useResizeObserver: false,
      removeGuideOnOverflow: true,
      showGuides: store.canvas.showGuides,
    }
  }

  function refreshGuides() {
    const h = hGuides.value
    const v = vGuides.value
    if (!h || !v) return
    const zoom = localScale.value
    const unit = pickRulerUnit(zoom)
    const hScrollPos = rulerScrollPos('x')
    const vScrollPos = rulerScrollPos('y')
    try {
      h.scroll(hScrollPos)
      v.scroll(vScrollPos)
      h.scrollGuides(localOffset.value.x)
      v.scrollGuides(localOffset.value.y)
      try {
        h.setState({ zoom, unit })
        v.setState({ zoom, unit })
      } catch {
        /* ignore */
      }
      h.resize()
      v.resize()
    } catch {
      // ignore transient errors
    }
  }

  function splitGuidesByAxis() {
    const hPositions: number[] = []
    const vPositions: number[] = []
    for (const g of store.guides) {
      if (g.direction === 'vertical') hPositions.push(g.position)
      else vPositions.push(g.position)
    }
    return {
      hPositions: hPositions.sort((a, b) => a - b),
      vPositions: vPositions.sort((a, b) => a - b),
    }
  }

  function applyStoreGuidesToLibrary() {
    const h = hGuides.value
    const v = vGuides.value
    if (!h || !v) return
    const { hPositions, vPositions } = splitGuidesByAxis()
    isApplyingStoreGuides = true
    try {
      h.setState({ guides: hPositions })
      v.setState({ guides: vPositions })
    } catch {
      /* ignore */
    } finally {
      nextTick(() => {
        isApplyingStoreGuides = false
      })
    }
  }

  function mergeAxisPositionsIntoGuideLines(hPositions: number[], vPositions: number[]) {
    const existingIdKey = new Map<string, string>()
    for (const g of store.guides) {
      existingIdKey.set(`${g.direction}|${g.position}`, g.id)
    }
    const result: GuideLine[] = []
    const pushDir = (direction: 'horizontal' | 'vertical', positions: number[]) => {
      for (const p of positions) {
        const key = `${direction}|${p}`
        const id =
          existingIdKey.get(key) ??
          `guide_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        existingIdKey.delete(key)
        result.push({ id, direction, position: Math.round(p) })
      }
    }
    pushDir('horizontal', vPositions)
    pushDir('vertical', hPositions)
    return result
  }

  function createGuides() {
    destroyGuides()
    if (!hGuidesRef.value || !vGuidesRef.value) return
    const common = commonGuidesOptions()
    const { hPositions, vPositions } = splitGuidesByAxis()

    const horizontalGuideStyle = {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(to right, ${GUIDE_LINE_COLOR} 0 6px, transparent 6px 10px)`,
      backgroundSize: '8px 1px',
      height: '1px',
    }
    const verticalGuideStyle = {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(to bottom, ${GUIDE_LINE_COLOR} 0 6px, transparent 6px 10px)`,
      backgroundSize: '1px 8px',
      width: '1px',
    }

    const h = new Guides(hGuidesRef.value, {
      ...common,
      type: 'horizontal',
      height: RULER_SIZE,
      guides: hPositions,
      lockGuides: false,
      guideStyle: horizontalGuideStyle,
      dragGuideStyle: horizontalGuideStyle,
    })
    const v = new Guides(vGuidesRef.value, {
      ...common,
      type: 'vertical',
      width: RULER_SIZE,
      guides: vPositions,
      lockGuides: false,
      guideStyle: verticalGuideStyle,
      dragGuideStyle: verticalGuideStyle,
    })

    const handleDragStart = () => {
      isGuidesDragging = true
    }
    const handleDragEnd = () => {
      if (!isGuidesDragging) return
      isGuidesDragging = false
      store.pushHistory()
    }
    const onAnyMouseDown = () => handleDragStart()
    hGuidesRef.value.addEventListener('mousedown', onAnyMouseDown)
    vGuidesRef.value.addEventListener('mousedown', onAnyMouseDown)
    document.addEventListener('mouseup', handleDragEnd)
    ;(h as any).__teardown = () => {
      hGuidesRef.value?.removeEventListener('mousedown', onAnyMouseDown)
      vGuidesRef.value?.removeEventListener('mousedown', onAnyMouseDown)
      document.removeEventListener('mouseup', handleDragEnd)
    }

    let lastH = hPositions.join(',')
    let lastV = vPositions.join(',')
    h.on('changeGuides', (e) => {
      if (isApplyingStoreGuides) return
      const arr = e.guides.map((n: number) => Math.round(n))
      const sig = arr.join(',')
      if (sig === lastH) return
      lastH = sig
      const vAxisCurrent = splitGuidesByAxis().vPositions
      const merged = mergeAxisPositionsIntoGuideLines(arr, vAxisCurrent)
      if (isGuidesDragging) store.setGuidesSilent(merged)
      else store.setGuides(merged)
    })
    v.on('changeGuides', (e) => {
      if (isApplyingStoreGuides) return
      const arr = e.guides.map((n: number) => Math.round(n))
      const sig = arr.join(',')
      if (sig === lastV) return
      lastV = sig
      const hAxisCurrent = splitGuidesByAxis().hPositions
      const merged = mergeAxisPositionsIntoGuideLines(hAxisCurrent, arr)
      if (isGuidesDragging) store.setGuidesSilent(merged)
      else store.setGuides(merged)
    })

    hGuides.value = h
    vGuides.value = v
  }

  function destroyGuides() {
    try {
      ;(hGuides.value as any)?.__teardown?.()
    } catch {
      /* ignore */
    }
    try {
      hGuides.value?.destroy()
    } catch {
      /* ignore */
    }
    try {
      vGuides.value?.destroy()
    } catch {
      /* ignore */
    }
    hGuides.value = null
    vGuides.value = null
  }

  // Re-draw rulers + reposition guide markers whenever transform / viewport / theme changes
  watch(
    [localOffset, localScale, viewportWidth, viewportHeight],
    () => {
      nextTick(() => refreshGuides())
    },
    { deep: true },
  )

  watch(
    () => store.canvas.showRuler,
    (v) => {
      nextTick(() => {
        if (v) {
          createGuides()
          nextTick(() => {
            applyStoreGuidesToLibrary()
            refreshGuides()
          })
        } else {
          destroyGuides()
        }
      })
    },
  )

  watch(
    () => store.guides,
    () => {
      if (isApplyingStoreGuides) return
      if (isGuidesDragging) return
      nextTick(() => applyStoreGuidesToLibrary())
    },
    { deep: true },
  )

  onBeforeUnmount(() => {
    destroyGuides()
  })

  return {
    // DOM refs (bind to template)
    hGuidesRef,
    vGuidesRef,
    // Lifecycle hooks — call from parent onMounted after refs are ready
    initGuides() {
      if (store.canvas.showRuler) {
        nextTick(() => {
          createGuides()
          nextTick(() => {
            applyStoreGuidesToLibrary()
            refreshGuides()
          })
        })
      }
    },
    // Force refresh (public API)
    refreshGuides,
  }
}

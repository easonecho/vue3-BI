import { ref, shallowRef, watch, nextTick, onBeforeUnmount } from 'vue'
import Guides from '@scena/guides'
import type { Ref } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import {
  RULER_SIZE,
  RULER_BG_COLOR,
  RULER_LINE_COLOR,
  RULER_TEXT_COLOR,
  GUIDE_LINE_COLOR,
} from '@/views/bi-editor/constants/canvas-constants'
import {
  asGuidesApi,
  collectAllDescendants,
  removeNonScaleDom,
  splitGuidesByAxis,
  mergeAxisPositionsIntoGuideLines,
  rulerScrollPos,
  formatRulerLabel,
  pickRulerUnit,
} from '../utils/ruler-guides-utils'

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
  /**
   * 🔑 当前 store.guides 变更是否来自 @scena 自身的 changeGuides 事件。
   *   true  → 跳过重建（@scena 内部 state 已正确，changeGuides 在用户交互中持续触发）
   *   false → 外部变更（undo/redo/clear）→ 重建实例同步 @scena（setGuides API 失效）
   */
  let isScenaDriven = false
  /**
   * 🔑 刻度 DOM 白名单（只在创建 Guides 实例时立刻记录）。
   * 创建时容器里只有刻度 DOM，之后用户辅助线 DOM 都不在白名单内，可安全删除。
   */
  let scaleWhitelistH: Set<Node> | null = null
  let scaleWhitelistV: Set<Node> | null = null

  // ========== Ruler helpers ==========
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
    const hScrollPos = rulerScrollPos(screenToWorld, 'x')
    const vScrollPos = rulerScrollPos(screenToWorld, 'y')
    try {
      h.scroll(hScrollPos)
      v.scroll(vScrollPos)
      // 🔑 scrollGuides 的参数口径：必须与 rulerScrollPos（screenToWorld → 世界坐标单位）一致
      //    - horizontal Guides（水平标尺，X 轴刻度）：挂的是"垂直辅助线（竖线）"
      //      竖线要随画布内容在「Y 方向」的平移保持对齐 → 传入「Y 方向世界坐标偏移」
      //    - vertical Guides（垂直标尺，Y 轴刻度）：挂的是"水平辅助线（横线）"
      //      横线要随画布内容在「X 方向」的平移保持对齐 → 传入「X 方向世界坐标偏移」
      h.scrollGuides(rulerScrollPos(screenToWorld, 'y'))
      v.scrollGuides(rulerScrollPos(screenToWorld, 'x'))
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

  function applyStoreGuidesToLibrary() {
    const h = hGuides.value
    const v = vGuides.value
    if (!h || !v) return
    const { hPositions, vPositions } = splitGuidesByAxis(store.guides)
    isApplyingStoreGuides = true
    try {
      // 🔑 handleClearGuides（清空所有辅助线）核心兜底：
      //    当前 @scena/guides 0.29.2 的 setGuides([]) / setState({guides:[]}) / removeGuide(i)
      //    都只改内部 state，不真正从 DOM 删除已渲染的 user guide 线。
      //    这里用「创建时白名单」方案：只 remove 不在刻度白名单 Set 内的元素节点。
      if (hPositions.length === 0) removeNonScaleDom(hGuidesRef.value, scaleWhitelistH)
      if (vPositions.length === 0) removeNonScaleDom(vGuidesRef.value, scaleWhitelistV)

      const hApi = asGuidesApi(h)
      const vApi = asGuidesApi(v)
      // 🔑 @scena/guides 0.29.2 没有 setGuides 方法，正确 API 是 loadGuides：
      //    loadGuides 调用「内部 Guides 组件」的 setState({guides})，renderGuides 读 state.guides
      //    重新渲染 DOM → 真正更新画布辅助线。
      if (hApi?.loadGuides) {
        hApi.loadGuides([...hPositions])
      } else if (hApi?.setGuides) {
        hApi.setGuides([...hPositions])
      } else {
        hApi?.setState?.({ guides: hPositions })
      }
      if (vApi?.loadGuides) {
        vApi.loadGuides([...vPositions])
      } else if (vApi?.setGuides) {
        vApi.setGuides([...vPositions])
      } else {
        vApi?.setState?.({ guides: vPositions })
      }
    } catch {
      /* ignore */
    } finally {
      nextTick(() => {
        isApplyingStoreGuides = false
      })
    }
  }

  function createGuides() {
    destroyGuides()
    if (!hGuidesRef.value || !vGuidesRef.value) return
    const common = commonGuidesOptions()
    const { hPositions, vPositions } = splitGuidesByAxis(store.guides)

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
      // 🔑 不在此传 guides/defaultGuides：构造后统一用 loadGuides（正确 API）设置初始辅助线。
      lockGuides: false,
      guideStyle: horizontalGuideStyle,
      dragGuideStyle: horizontalGuideStyle,
    })
    const v = new Guides(vGuidesRef.value, {
      ...common,
      type: 'vertical',
      width: RULER_SIZE,
      lockGuides: false,
      guideStyle: verticalGuideStyle,
      dragGuideStyle: verticalGuideStyle,
    })

    // 🔑 loadGuides 是 @scena/guides 0.29.2 设置辅助线的正确 API
    ;asGuidesApi(h)?.loadGuides?.([...hPositions])
    ;asGuidesApi(v)?.loadGuides?.([...vPositions])

    // 🔑 用 @scena 的 dragStart/dragEnd EventEmitter 事件替代 DOM mousedown/mouseup
    ;asGuidesApi(h)?.on?.('dragStart', () => {
      isGuidesDragging = true
    })
    ;asGuidesApi(v)?.on?.('dragStart', () => {
      isGuidesDragging = true
    })
    // dragEnd 同步触发在 changeGuides 异步 callback 之前；由 changeGuides 重置标志
    const onDragEnd = () => {
      nextTick(() => {
        if (isGuidesDragging) {
          isGuidesDragging = false
        }
      })
    }
    ;asGuidesApi(h)?.on?.('dragEnd', onDragEnd)
    ;asGuidesApi(v)?.on?.('dragEnd', onDragEnd)
    const hApi = asGuidesApi(h)
    if (hApi) hApi.__teardown = () => {}

    let lastH = hPositions.join(',')
    let lastV = vPositions.join(',')
    h.on('changeGuides', (e) => {
      if (isApplyingStoreGuides) return
      const arr = e.guides.map((n: number) => Math.round(n))
      const sig = arr.join(',')
      if (sig === lastH) return
      lastH = sig
      const vAxisCurrent = splitGuidesByAxis(store.guides).vPositions
      const merged = mergeAxisPositionsIntoGuideLines(store.guides, arr, vAxisCurrent)
      // 🔑 标记变更来自 @scena 自身，watch(store.guides) 跳过重建
      isScenaDriven = true
      // 🔑 changeGuides 在 dragEnd 之后异步触发，此时 isGuidesDragging 仍为 true。
      isGuidesDragging = false
      store.setGuides(merged)
    })
    v.on('changeGuides', (e) => {
      if (isApplyingStoreGuides) return
      const arr = e.guides.map((n: number) => Math.round(n))
      const sig = arr.join(',')
      if (sig === lastV) return
      lastV = sig
      const hAxisCurrent = splitGuidesByAxis(store.guides).hPositions
      const merged = mergeAxisPositionsIntoGuideLines(store.guides, hAxisCurrent, arr)
      isScenaDriven = true
      isGuidesDragging = false
      store.setGuides(merged)
    })

    hGuides.value = h
    vGuides.value = v

    // 🔑 立刻记录刻度白名单（new Guides 同步 renderSelf 完成刻度渲染，此时没有任何 user guide 线）
    scaleWhitelistH = collectAllDescendants(hGuidesRef.value)
    scaleWhitelistV = collectAllDescendants(vGuidesRef.value)
  }

  function destroyGuides() {
    try {
      asGuidesApi(hGuides.value)?.__teardown?.()
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
    // destroy 不会清空容器 innerHTML，导致新旧 DOM 叠加（刻度偏移、Y 轴消失）
    if (hGuidesRef.value) hGuidesRef.value.innerHTML = ''
    if (vGuidesRef.value) vGuidesRef.value.innerHTML = ''
    hGuides.value = null
    vGuides.value = null
    scaleWhitelistH = null
    scaleWhitelistV = null
  }

  // Re-draw rulers + reposition guide markers whenever transform / viewport / theme changes
  // 🔑 性能优化：字符串签名替代 deep watch。
  watch(
    () =>
      `${localOffset.value.x}_${localOffset.value.y}_${localScale.value}_${viewportWidth.value}_${viewportHeight.value}`,
    () => {
      nextTick(() => refreshGuides())
    },
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

  // 显示/隐藏辅助线（toggleGuides）：只同步 state，不重建实例 —— 避免刻度偏移/消失
  watch(
    () => store.canvas.showGuides,
    (next) => {
      if (!hGuides.value || !vGuides.value) return
      try {
        hGuides.value.setState({ showGuides: next })
        vGuides.value.setState({ showGuides: next })
      } catch {
        /* ignore transient */
      }
    },
  )

  // 🔑 性能优化：JSON.stringify 签名替代 deep watch（guides 可能被原地 push/splice 修改）
  watch(
    () => JSON.stringify(store.guides),
    () => {
      if (isApplyingStoreGuides) return
      // @scena 自身变更（用户拖拽/点击添加）：内部 state 已正确，跳过重建
      if (isScenaDriven) {
        nextTick(() => {
          isScenaDriven = false
        })
        return
      }
      // 外部变更（undo/redo/clear）：重建实例同步 @scena
      if (!hGuides.value && !vGuides.value) return
      nextTick(() => {
        createGuides()
        nextTick(() => {
          applyStoreGuidesToLibrary()
          refreshGuides()
        })
      })
    },
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

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
  /**
   * 🔑 当前 store.guides 变更是否来自 @scena 自身的 changeGuides 事件。
   *   true  → 跳过重建（@scena 内部 state 已正确，changeGuides 在用户交互中持续触发）
   *   false → 外部变更（undo/redo/clear）→ 重建实例同步 @scena（setGuides API 失效）
   */
  let isScenaDriven = false
  /**
   * 🔑 刻度 DOM 白名单（只在创建 Guides 实例时立刻记录）。
   *
   * 为什么不用 class 匹配（.scena-guides-guide 等）：
   *   之前所有版本都验证过，当前 @scena/guides 版本 (0.29.2) 的 setGuides/setState/removeGuide
   *   只改内部 state，不真正从 DOM 删除已渲染的 guide 线；而 class 匹配在不同打包下可能不准。
   *
   * 为什么不用 [class*="guide"] 暴力删：
   *   刻度的容器 class 也带 "guide"（scena-guides-ruler-*），会把刻度一起删掉。
   *
   * 正确方案（时间维度区分）：
   *   createGuides → new Guides({ ..., guides: [] })，此时容器里只有 React 渲染的刻度主容器/刻度线/标签，
   *   还没有任何 user guide 线，立刻用 TreeWalker 收集所有 descendant DOM 节点放进 Set → 白名单。
   *   之后真实初始 guides（store 里的）和用户拖出来的 guides 渲染出的 DOM 都不在白名单内，可安全删除。
   */
  let scaleWhitelistH: Set<Node> | null = null
  let scaleWhitelistV: Set<Node> | null = null

  function collectAllDescendants(root: HTMLElement | null | undefined): Set<Node> {
    const set = new Set<Node>()
    if (!root) return set
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL)
    let node: Node | null = walker.currentNode
    while (node) {
      set.add(node)
      node = walker.nextNode()
    }
    return set
  }
  function removeNonScaleDom(root: HTMLElement | null | undefined, whitelist: Set<Node> | null) {
    if (!root || !whitelist) return
    const toRemove: Node[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    let node: Node | null = walker.currentNode
    while (node) {
      if (!whitelist.has(node)) toRemove.push(node)
      node = walker.nextNode()
    }
    toRemove.forEach((n) => n.parentNode?.removeChild(n))
  }

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
      // 🔑 scrollGuides 的参数口径：必须与 rulerScrollPos（screenToWorld → 世界坐标单位）一致
      //    （@scena/guides 源码 L5192 注释：Scroll position of guides (horizontal: y, vertical: x)）
      //
      //    - horizontal Guides（水平标尺，X 轴刻度）：挂的是"垂直辅助线（竖线）"
      //      竖线要随画布内容在「Y 方向」的平移保持对齐 → 需要传入「Y 方向世界坐标偏移」= rulerScrollPos('y')
      //    - vertical Guides（垂直标尺，Y 轴刻度）：挂的是"水平辅助线（横线）"
      //      横线要随画布内容在「X 方向」的平移保持对齐 → 需要传入「X 方向世界坐标偏移」= rulerScrollPos('x')
      //
      //    之前两个 bug：
      //      1) 传了 localOffset.value 而非 rulerScrollPos → 单位错（像素 vs 世界坐标），方向也错
      //      2) 两者方向传反 → 表现为"往上滚动 / 往右滚动时辅助线向反方向跑"
      h.scrollGuides(rulerScrollPos('y'))
      v.scrollGuides(rulerScrollPos('x'))
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
      // 🔑 handleClearGuides（清空所有辅助线）核心兜底：
      //    当前 @scena/guides 0.29.2 的 setGuides([]) / setState({guides:[]}) / removeGuide(i)
      //    都只改内部 state，不真正从 DOM 删除已渲染的 user guide 线。
      //    这里用「创建时白名单」方案：只 remove 不在刻度白名单 Set 内的元素节点，
      //    100% 不碰刻度，100% 删掉后来的 guide 线（不依赖任何 class 名或库 API 行为）。
      if (hPositions.length === 0) removeNonScaleDom(hGuidesRef.value, scaleWhitelistH)
      if (vPositions.length === 0) removeNonScaleDom(vGuidesRef.value, scaleWhitelistV)

      const hAny = h as any
      const vAny = v as any
      // 🔑 @scena/guides 0.29.2 没有 setGuides 方法，正确 API 是 loadGuides：
      //    loadGuides 调用「内部 Guides 组件」的 setState({guides})，renderGuides 读 state.guides
      //    重新渲染 DOM → 真正更新画布辅助线。
      //    而 publicGuides.setState({guides}) 只更新 InnerGuides 的 props，内部 Guides 只读
      //    defaultGuides 不读 guides → 无效（这是之前撤销后辅助线消失的根因之一）。
      if (typeof hAny.loadGuides === 'function') {
        hAny.loadGuides([...hPositions])
      } else if (typeof hAny.setGuides === 'function') {
        hAny.setGuides([...hPositions])
      } else {
        hAny.setState({ guides: hPositions })
      }
      if (typeof vAny.loadGuides === 'function') {
        vAny.loadGuides([...vPositions])
      } else if (typeof vAny.setGuides === 'function') {
        vAny.setGuides([...vPositions])
      } else {
        vAny.setState({ guides: vPositions })
      }
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
          existingIdKey.get(key) ?? `guide_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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
      // 🔑 不在此传 guides/defaultGuides：
      //   @scena/guides 0.29.2 构造函数只读 props.defaultGuides 初始化 state.guides，
      //   但 defaultGuides 不在类型定义中；且构造选项里的 guides 会被运行时静默忽略。
      //   统一在构造后用 loadGuides（正确 API）设置初始辅助线。
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

    // 🔑 loadGuides 是 @scena/guides 0.29.2 设置辅助线的正确 API：
    //    它调用「内部 Guides 组件」的 setState({guides})，renderGuides 读 state.guides
    //    重新渲染 DOM → 真正画出辅助线。
    //    注意：setGuides 方法在本版本不存在；setState({guides}) 只更新 InnerGuides 的
    //    props，内部 Guides 只读 defaultGuides 不读 guides → 无效。
    ;(h as any).loadGuides([...hPositions])
    ;(v as any).loadGuides([...vPositions])

    // 🔑 用 @scena 的 dragStart/dragEnd EventEmitter 事件替代 mousedown/mouseup：
    //    @scena 内部用 pointer 事件处理拖拽并 stopPropagation，
    //    DOM 元素上的 mousedown 监听器永远不会触发（运行时日志已证实）。
    //    dragStart/dragEnd 是 @scena EventEmitter 事件，可靠触发。
    ;(h as any).on('dragStart', () => {
      isGuidesDragging = true
    })
    ;(v as any).on('dragStart', () => {
      isGuidesDragging = true
    })
    // 🔑 dragEnd 同步触发在 changeGuides（React setState 异步 callback）之前。
    //    不在此重置 isGuidesDragging——让 changeGuides 处理完 setGuides 后再重置。
    //    如果 changeGuides 没有触发（拖拽取消），在 nextTick 中重置。
    const onDragEnd = () => {
      nextTick(() => {
        if (isGuidesDragging) {
          isGuidesDragging = false
        }
      })
    }
    ;(h as any).on('dragEnd', onDragEnd)
    ;(v as any).on('dragEnd', onDragEnd)
    ;(h as any).__teardown = () => {}

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
      // 🔑 标记变更来自 @scena 自身，watch(store.guides) 跳过重建
      isScenaDriven = true
      // 🔑 changeGuides 在 dragEnd 之后异步触发，此时 isGuidesDragging 仍为 true。
      //    用 setGuides（带 pushHistory）写入历史，然后重置标志。
      isGuidesDragging = false
      store.setGuides(merged)
    })
    v.on('changeGuides', (e) => {
      if (isApplyingStoreGuides) return
      const arr = e.guides.map((n: number) => Math.round(n))
      const sig = arr.join(',')
      if (sig === lastV) return
      lastV = sig
      const hAxisCurrent = splitGuidesByAxis().hPositions
      const merged = mergeAxisPositionsIntoGuideLines(hAxisCurrent, arr)
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
    // destroy 不会清空容器 innerHTML，导致新旧 DOM 叠加（刻度偏移、Y 轴消失）
    // 手动清掉，保证下次 createGuides 时从干净容器开始
    if (hGuidesRef.value) hGuidesRef.value.innerHTML = ''
    if (vGuidesRef.value) vGuidesRef.value.innerHTML = ''
    hGuides.value = null
    vGuides.value = null
    // 释放白名单引用
    scaleWhitelistH = null
    scaleWhitelistV = null
  }

  // Re-draw rulers + reposition guide markers whenever transform / viewport / theme changes
  // 🔑 性能优化：字符串签名替代 deep watch。
  //   localOffset 是 {x,y} 对象，deep:true 会遍历其属性建立依赖；
  //   localScale/viewportW/H 是原始值，deep 对它们无意义。
  //   改为读取具体属性值拼接签名，单次比较即可判断是否变化。
  watch(
    () => `${localOffset.value.x}_${localOffset.value.y}_${localScale.value}_${viewportWidth.value}_${viewportHeight.value}`,
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

  // 🔑 性能优化：JSON.stringify 签名替代 deep watch。
  //   guides 数组可能被 push/splice 原地修改（非引用替换），
  //   浅 watch 无法捕获；签名式可同时捕获引用替换和元素变更。
  watch(
    () => JSON.stringify(store.guides),
    () => {
      if (isApplyingStoreGuides) return
      // 🔑 @scena 自身变更（用户拖拽/点击添加）：@scena 内部 state 已正确
      //   跳过重建，只在 nextTick 中重置标志
      if (isScenaDriven) {
        nextTick(() => {
          isScenaDriven = false
        })
        return
      }
      // 🔑 外部变更（undo/redo/clear）：重建实例同步 @scena
      //    @scena/guides 的 setGuides/setState 无法更新内部 state，
      //    必须重建实例才能让画布上显示正确数量的辅助线。
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

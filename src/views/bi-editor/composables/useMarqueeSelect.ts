import { computed, reactive, ref, type Ref } from 'vue'
import type { useBiEditorStore } from '@/stores/bi-editor'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

interface MarqueeSelectOptions {
  store: BiEditorStore
  /** 画布 sheet DOM（框选期间在其内部查询组件元素） */
  sheetRef: Ref<HTMLElement | null>
  /** 浏览器视口坐标 → 画布世界坐标 */
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number }
}

/**
 * 框选 (marquee) 交互：从 CanvasArea 抽出的自包含逻辑。
 *
 * 性能要点（与原实现一致）：
 *   - 框选期间不写 store.selectedIds，只通过 classList 直改 DOM 选中态
 *   - mousemove 由 RAF 合并为每帧一次更新
 *   - mouseup 才把最终命中集合一次性写回 store
 */
export function useMarqueeSelect(options: MarqueeSelectOptions) {
  const { store, sheetRef, clientToWorld } = options

  // ========== 框选 marquee ==========
  // 🔑 性能优化：拆分为 reactive 数据 + computed style。
  //   原实现 marquee.style 是 reactive getter，每次模板访问都重算 left/top/width/height。
  //   改为 computed 后，Vue 会缓存计算结果，仅在依赖字段真正变化时才重算。
  const marquee = reactive({
    visible: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    additive: false,
  })
  const marqueeStyle = computed(() => {
    const left = Math.min(marquee.startX, marquee.endX)
    const top = Math.min(marquee.startY, marquee.endY)
    const width = Math.abs(marquee.endX - marquee.startX)
    const height = Math.abs(marquee.endY - marquee.startY)
    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: 9999,
      pointerEvents: 'none' as const,
    }
  })

  // 🔑 性能优化：RAF 批量更新 marquee 位置。
  //   选中态不再走 Vue 响应式，改为 DOM 直改（见 flushMarqueeDomDirect）。
  let marqueeRafId: number | null = null
  let marqueePendingX = 0
  let marqueePendingY = 0

  /**
   * 🔑 框选 DOM 直改模式状态：
   *   框选期间不写 store.selectedIds，只通过 classList.toggle 直接改 DOM 的选中边框，
   *   彻底绕开 Vue 响应式 → 零 computed 重算 / 零 v-memo 比较 / 零组件 re-patch。
   *   mouseup 时才把最终命中集合一次性写回 store。
   */
  let inMarqueeMode = false
  /** 框选开始时的基线选中集合（Shift/Ctrl 累加模式下非空） */
  let marqueeBaselineIds: Set<string> = new Set()
  /** 当前帧命中集合（相对基线合并后的结果） */
  let marqueeHitSet: Set<string> = new Set()
  /** 上一帧命中集合（用于计算 diff，只改变化的 DOM） */
  let marqueePrevHitSet: Set<string> = new Set()
  /** 当前帧主选中 id（z-index 最高的命中） */
  let marqueeMasterId: string | null = null
  /** 上一帧主选中 id（用于 diff，只改 2 个元素的 primary class） */
  let marqueePrevMasterId: string | null = null
  /** 🔑 组件 id → DOM 元素缓存：框选开始时一次性建立，避免每帧 querySelectorAll O(N²) */
  const marqueeCompDomCache: Map<string, HTMLElement> = new Map()

  const MULTI_DOM_CLASS = 'marquee-dom-multi'
  const PRIMARY_DOM_CLASS = 'marquee-dom-primary'

  /**
   * 🔑 框选移动距离阈值：超过该值才视为真实框选（而非纯点击）。
   *   用于决定 mouseup 后是否屏蔽浏览器自动派发的 click 事件。
   */
  const MARQUEE_MOVE_THRESHOLD = 2
  let marqueeMoved = false

  /**
   * 🔑 mouseup 后浏览器会在 mousedown 与 mouseup 的共同祖先上派发 click 事件。
   *   若起点/终点都在 canvas-sheet 内，click 会命中 @click.self → store.clearSelection()，
   *   把刚框选的成果清空。框选发生真实位移时，置此 ref=true，并在下一个宏任务重置；
   *   click 事件先于 setTimeout(0) 回调派发，因此 handleEmptyAreaClick 能看到 true 而跳过清空。
   */
  const suppressClick = ref(false)

  /** 屏蔽 mouseup 后浏览器自动派发的 click（拖拽/框选结束时调用） */
  function suppressNextClick() {
    suppressClick.value = true
    setTimeout(() => {
      suppressClick.value = false
    }, 0)
  }

  /** 建立组件 DOM 元素缓存（一次 O(N) 遍历，后续每帧 O(1) 取元素） */
  function buildMarqueeDomCache() {
    marqueeCompDomCache.clear()
    const sheet = sheetRef.value
    if (!sheet) return
    const els = sheet.querySelectorAll<HTMLElement>('.component-layout-box')
    for (let i = 0; i < els.length; i++) {
      const id = els[i].dataset.compId
      if (id) marqueeCompDomCache.set(id, els[i])
    }
  }

  /** 清理所有 marquee 临时 DOM class（用 querySelectorAll 扫一遍最安全） */
  function clearMarqueeDomClasses() {
    const sheet = sheetRef.value
    if (!sheet) return
    const targets = sheet.querySelectorAll<HTMLElement>(`.${MULTI_DOM_CLASS}, .${PRIMARY_DOM_CLASS}`)
    for (let i = 0; i < targets.length; i++) {
      targets[i].classList.remove(MULTI_DOM_CLASS, PRIMARY_DOM_CLASS)
    }
  }

  function flushMarqueeDomDirect() {
    marqueeRafId = null
    marquee.endX = marqueePendingX
    marquee.endY = marqueePendingY
    if (
      !marqueeMoved &&
      (Math.abs(marquee.endX - marquee.startX) > MARQUEE_MOVE_THRESHOLD ||
        Math.abs(marquee.endY - marquee.startY) > MARQUEE_MOVE_THRESHOLD)
    ) {
      marqueeMoved = true
    }

    // --- 命中测试（纯 O(N) 遍历，不写 store） ---
    const rectX = Math.min(marquee.startX, marquee.endX)
    const rectY = Math.min(marquee.startY, marquee.endY)
    const rectR = Math.max(marquee.startX, marquee.endX)
    const rectB = Math.max(marquee.startY, marquee.endY)

    // 累加模式：以基线为基础；非累加模式：从空集开始
    if (marquee.additive) {
      marqueeHitSet = new Set(marqueeBaselineIds)
    } else {
      marqueeHitSet.clear()
    }
    let maxZ = -Infinity
    let masterId = ''
    const allComps = store.components
    for (let i = 0; i < allComps.length; i++) {
      const c = allComps[i]
      if (!c.visible || c.locked) continue
      const cR = c.x + c.width
      const cB = c.y + c.height
      if (c.x < rectR && cR > rectX && c.y < rectB && cB > rectY) {
        marqueeHitSet.add(c.id)
        if (c.zIndex > maxZ) {
          maxZ = c.zIndex
          masterId = c.id
        }
      }
    }
    const newMaster = marqueeHitSet.size > 0 ? masterId || null : null

    // --- DOM 直改：仅对 diff 的元素 toggle class ---
    // 1. 主选中（primary）：先处理（主选中同时也是 multi，先清旧 master 的 primary）
    if (marqueePrevMasterId !== newMaster) {
      if (marqueePrevMasterId) {
        const oldEl = marqueeCompDomCache.get(marqueePrevMasterId)
        oldEl?.classList.remove(PRIMARY_DOM_CLASS)
      }
      if (newMaster) {
        const newEl = marqueeCompDomCache.get(newMaster)
        newEl?.classList.add(PRIMARY_DOM_CLASS)
      }
      marqueePrevMasterId = newMaster
    }
    marqueeMasterId = newMaster

    // 2. 多选集合（multi）：遍历 prev 和 next 的对称差
    //    只对新增/移除的元素改 class，不碰保持不变的
    for (const id of marqueePrevHitSet) {
      if (!marqueeHitSet.has(id) && id !== marqueePrevMasterId) {
        const el = marqueeCompDomCache.get(id)
        el?.classList.remove(MULTI_DOM_CLASS)
      }
    }
    for (const id of marqueeHitSet) {
      if (!marqueePrevHitSet.has(id) && id !== marqueeMasterId) {
        const el = marqueeCompDomCache.get(id)
        el?.classList.add(MULTI_DOM_CLASS)
      }
    }
    // swap prev = next 供下一帧 diff
    const tmp = marqueePrevHitSet
    marqueePrevHitSet = marqueeHitSet
    marqueeHitSet = tmp // 复用对象减少 GC（下次会被 clear / new Set）
  }

  function onMarqueeMove(e: MouseEvent) {
    const world = clientToWorld(e.clientX, e.clientY)
    // 🔑 性能优化：缓存最新坐标，由 RAF 合并为每帧一次 DOM 直改更新
    marqueePendingX = world.x
    marqueePendingY = world.y
    if (marqueeRafId !== null) return
    marqueeRafId = requestAnimationFrame(flushMarqueeDomDirect)
  }

  function onMarqueeUp() {
    window.removeEventListener('mousemove', onMarqueeMove)
    window.removeEventListener('mouseup', onMarqueeUp)
    // 🔑 框选结束：移除全局 crosshair cursor
    document.body.classList.remove('bi-marqueeing')
    marquee.visible = false
    if (marqueeRafId !== null) {
      cancelAnimationFrame(marqueeRafId)
      // 🔑 保证最终状态用 mouseup 的位置 flush 一次，不丢最后一帧
      flushMarqueeDomDirect()
    }

    const finalHitSet = marqueePrevHitSet
    const finalMaster = marqueeMasterId

    // 🔑 清所有 DOM 临时 class（Vue 接管后会重新画正确的选中边框）
    clearMarqueeDomClasses()
    inMarqueeMode = false

    // 🔑 写回 store：仅在选中集合与基线不同时才赋值 → 避免无谓响应式
    const baselineArr = [...marqueeBaselineIds]
    const finalArr = [...finalHitSet]
    const needCommit =
      finalArr.length !== baselineArr.length || !finalArr.every((id, i) => id === baselineArr[i])

    if (needCommit) {
      // 直接写 selectedIds + selectedId，不走 selectByRect（已做命中测试）
      store.$patch({
        selectedIds: finalArr,
        selectedId: finalMaster,
      })
      store.pushHistory()
    } else if (store.selectedId !== finalMaster) {
      // 集合相同但主选中变了（z-index 最高者变化）
      store.$patch({ selectedId: finalMaster })
      store.pushHistory()
    }

    // 🔑 清临时集合（避免下次框选残留数据）
    marqueeBaselineIds = new Set()
    marqueePrevHitSet = new Set()
    marqueeCompDomCache.clear()

    if (marqueeMoved) {
      // 🔑 屏蔽 mouseup 后浏览器自动派发的 click 事件（否则会清空刚框选的选中）
      suppressNextClick()
    }
  }

  /**
   * 开始框选（由 canvas-sheet 空白处 mousedown 调用）。
   * @param world 起点世界坐标
   * @param additive Shift/Ctrl 累加模式
   */
  function startMarquee(world: { x: number; y: number }, additive: boolean) {
    marquee.additive = additive
    // 🔑 进入 DOM 直改框选模式：
    //   1) 记基线选中集合
    //   2) 建 DOM 元素缓存（每帧 O(1) 取元素）
    //   3) 初始化帧内集合
    inMarqueeMode = true
    marqueeBaselineIds = new Set(additive ? store.selectedIds : [])
    buildMarqueeDomCache()
    marqueeHitSet = new Set(marqueeBaselineIds)
    marqueePrevHitSet = new Set()
    marqueeMasterId = null
    marqueePrevMasterId = null

    // 由于 canvas-sheet 相对 canvas-offset-layer 位于 x=0/y=0，world 就是以 sheet 左上角为原点
    marquee.startX = world.x
    marquee.startY = world.y
    marquee.endX = world.x
    marquee.endY = world.y
    marquee.visible = true
    marqueeMoved = false
    window.addEventListener('mousemove', onMarqueeMove)
    window.addEventListener('mouseup', onMarqueeUp, { once: true })
    // 🔑 框选中全局 cursor: crosshair
    document.body.classList.add('bi-marqueeing')
  }

  /** 组件卸载时清理全局监听与 cursor class */
  function dispose() {
    window.removeEventListener('mousemove', onMarqueeMove)
    window.removeEventListener('mouseup', onMarqueeUp)
    document.body.classList.remove('bi-marqueeing')
    if (marqueeRafId !== null) {
      cancelAnimationFrame(marqueeRafId)
      marqueeRafId = null
    }
  }

  return {
    marquee,
    marqueeStyle,
    suppressClick,
    suppressNextClick,
    startMarquee,
    dispose,
    /** 是否处于框选（DOM 直改）模式 */
    isMarqueeMode: () => inMarqueeMode,
  }
}

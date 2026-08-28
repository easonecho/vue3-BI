import { useBiEditorStore } from '@/stores/bi-editor'

/**
 * ResizeHandle: 8 个方向的拉伸手柄（四角 + 四边）。
 * position 对应 CSS cursor 类名，也决定了拉伸时宽高的变化方向。
 */
export interface ResizeHandle {
  position:
    | 'nw-cursor'
    | 'n-cursor'
    | 'ne-cursor'
    | 'e-cursor'
    | 'se-cursor'
    | 's-cursor'
    | 'sw-cursor'
    | 'w-cursor'
}

interface UseCanvasInteractionDeps {
  localScale: { value: number }
  isSpacePressed: { value: boolean }
  viewportRef: { value: HTMLElement | null }
  startPan: (e: MouseEvent) => void
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number }
  snapRectToGuides: (
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ) => {
    rect: { left: number; top: number; width: number; height: number }
    hitsX: number[]
    hitsY: number[]
  }
  applySnapLines: (hitsX: number[], hitsY: number[]) => void
  clearSnapLines: () => void
  /** 🔑 拖拽结束后重置吸附目标缓存，确保下次拖拽使用最新组件位置 */
  resetSnapCache: () => void
  onSelectComponent?: (id: string | null) => void
}

/**
 * 🔑 自研拖拽机制（取代 vue3-drag-resize）
 *
 * 设计要点：
 *  - 组件根 div 绑定 @mousedown.capture="wrapper-mousedown" → handleWrapperMouseDown
 *  - mousedown 时同步：选中组件 + 缓存 dragStart + 注册 document mousemove/mouseup
 *  - mousemove：用鼠标世界坐标相对起始点的 delta + comp 起始位置，计算新位置；
 *      网格吸附 + 智能吸附；只更新 store.setDragPreview（CSS transform 视觉跟随），不写 comp.x/y
 *  - mouseup：若 wasDragging，一次性 moveComponent + commitGroupDrag + pushHistory；
 *      否则视为纯点击，不写历史
 *
 * 关键优势（消除 VDR 的所有 hack）：
 *  - 不再依赖 VDR 内部 this.x/y：直接用真实 comp.x/y 作为起点
 *  - 没有 VDR watcher 触发的虚假 dragging/dragstop：isResizing/isCommittingGroupDragNow/isRestoringNow 拦截全部移除
 *  - 没有 undo/redo 后 VDR 缓存不同步的 vdrKey 重建机制
 *  - 没有 VDR 首次 dragging rect 偏差：dragInitRect 不再需要
 *
 * 历史记录策略：
 *  - 拖拽过程中只更新组件位置，**不调用** pushHistory
 *  - 拖拽结束（mouseup）**才调用** pushHistory
 *  - 纯点击（无实际移动）不调用 pushHistory
 */
export function useCanvasInteraction(deps: UseCanvasInteractionDeps) {
  const store = useBiEditorStore()
  const {
    localScale,
    isSpacePressed,
    viewportRef,
    startPan,
    screenToWorld,
    snapRectToGuides,
    applySnapLines,
    clearSnapLines,
    resetSnapCache,
    onSelectComponent,
  } = deps

  const resizeHandles: ResizeHandle[] = [
    { position: 'nw-cursor' },
    { position: 'n-cursor' },
    { position: 'ne-cursor' },
    { position: 'e-cursor' },
    { position: 'se-cursor' },
    { position: 's-cursor' },
    { position: 'sw-cursor' },
    { position: 'w-cursor' },
  ]

  let activeResizeAbort: (() => void) | null = null

  /**
   * 🔑 拖拽会话状态。
   *   全部字段在 mousedown 时一次性写入，mousemove 只读不写，
   *   避免响应式开销和状态泄漏。
   */
  let dragSession: {
    id: string
    /** 拖拽主体的起始 comp.x/y（真实坐标，不依赖任何第三方内部状态） */
    startX: number
    startY: number
    groupId?: string
    width: number
    height: number
    /** 鼠标按下时的世界坐标（mousedown 那一刻） */
    startWorldX: number
    startWorldY: number
    /** 最后一次吸附后的目标位置（mouseup 时一次性提交） */
    lastX: number
    lastY: number
    /** 是否发生过真实移动（用于区分纯点击 vs 真实拖拽） */
    moved: boolean
    /** 🔑 使用高启动阈值（12px）代替默认 2px。
     *   由 CanvasComponentItem 在 mousedown.capture 阶段打标记：
     *   - true：点在了 .base-chart / .el-table 这类内部有自己交互的容器中
     *           小范围移动（inside 数据平移、table 滚动条微拖等）由内部组件接管，
     *           大范围拖动（用户想挪走整个组件）才真正开始移动组件
     *   - false/undefined：普通区域（组件边缘、text/rect 内容区等），正常 2px 低阈值
     */
    highThreshold: boolean
    /** 缓存 viewport rect，避免 mousemove 中调用 getBoundingClientRect 触发 layout thrashing */
    viewportRect: DOMRect | null
  } | null = null

  function handleSelect(id: string | null) {
    store.selectComponent(id)
    onSelectComponent?.(id)
  }

  /**
   * 🔑 组件 mousedown 入口。
   *   由 CanvasComponentItem 的 @mousedown.capture 冒泡委托触发。
   *   - 中键 / 空格+左键：交给 startPan 处理画布平移
   *   - 普通左键：选中组件 + 启动拖拽会话（注册全局 mousemove/mouseup）
   */
  function handleWrapperMouseDown(e: MouseEvent, id: string) {
    // 中键或空格+左键 → 画布平移
    if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
      startPan(e)
      return
    }
    // 仅左键触发拖拽
    if (e.button !== 0) return

    // 🔑 同步选中：在 mousedown 时就确定选中状态，避免后续 click 阶段才选中导致拖拽与选中不同步
    handleSelect(id)

    const comp = store.getComponent?.(id) ?? store.components.find((c) => c.id === id)
    if (!comp || comp.locked || !comp.visible) return

    // 🔑 缓存 viewport rect，避免 mousemove 中频繁 getBoundingClientRect → layout thrashing
    const viewportRect = viewportRef.value?.getBoundingClientRect() ?? null

    // 计算鼠标在画布世界坐标系中的位置（mousedown 起点）
    let startWorldX = 0
    let startWorldY = 0
    if (viewportRect) {
      const w = screenToWorld(e.clientX - viewportRect.left, e.clientY - viewportRect.top)
      startWorldX = w.x
      startWorldY = w.y
    }

    dragSession = {
      id,
      startX: comp.x,
      startY: comp.y,
      groupId: comp.groupId,
      width: comp.width,
      height: comp.height,
      startWorldX,
      startWorldY,
      lastX: comp.x,
      lastY: comp.y,
      moved: false,
      // 🔑 读取 CanvasComponentItem 在事件对象上打的标记，决定是否使用高阈值
      highThreshold: Boolean((e as any).__biInternalInteractive),
      viewportRect,
    }

    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragUp)
    // 🔑 拖拽中全局 cursor: grabbing（覆盖所有元素，鼠标移出原组件也保持）
    document.body.classList.add('bi-dragging')
  }

  /** 把浏览器视口坐标 (clientX/Y) 换算成画布世界坐标，复用 mousedown 时缓存的 viewport rect */
  function clientToWorld(clientX: number, clientY: number) {
    const rect = dragSession?.viewportRect ?? viewportRef.value?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return screenToWorld(clientX - rect.left, clientY - rect.top)
  }

  /** 🔑 拖拽阈值：超过该值才视为真实拖拽（避免手抖产生历史污染）。
   *   内部交互区（ECharts/table）使用 6 倍高阈值（12px），小范围移动由内部组件接管，
   *   大范围拖动才认为是"用户真的想挪走整个组件"，解决 slider 拖拽 / inside 平移与
   *   组件整体拖拽的冲突。
   */
  const DRAG_THRESHOLD = 2
  const HIGH_DRAG_THRESHOLD = 12

  function onDragMove(e: MouseEvent) {
    const s = dragSession
    if (!s) return

    const comp = store.getComponent?.(s.id) ?? store.components.find((c) => c.id === s.id)
    if (!comp || comp.locked) return

    const world = clientToWorld(e.clientX, e.clientY)
    const dx = world.x - s.startWorldX
    const dy = world.y - s.startWorldY

    // 未越过阈值：不进入拖拽，避免点击抖动。
    // 🔑 highThreshold=true（点在了 ECharts/table 内部）时用高阈值：
    //   - 鼠标只移动了 <12px → 是用户在做 inside 平移 / slider 拖动 / table 微操作
    //     → 由 ECharts / table 自己处理，组件不动
    //   - 鼠标移动 > 12px → 明显是想把整个组件挪走 → 组件开始移动
    if (!s.moved) {
      const threshold = s.highThreshold ? HIGH_DRAG_THRESHOLD : DRAG_THRESHOLD
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return
      s.moved = true
    }

    // 目标位置 = 起始位置 + 鼠标世界坐标 delta
    let nx = s.startX + dx
    let ny = s.startY + dy

    // 吸附 + 网格
    if (store.canvas.snapToGrid) {
      const snapResult = snapRectToGuides(s.id, {
        left: nx,
        top: ny,
        width: s.width,
        height: s.height,
      })
      nx = snapResult.rect.left
      ny = snapResult.rect.top
      applySnapLines(snapResult.hitsX, snapResult.hitsY)
      const gs = store.canvas.gridSize
      nx = Math.round(nx / gs) * gs
      ny = Math.round(ny / gs) * gs
    } else {
      clearSnapLines()
    }

    // 🔑 性能优化：只更新 CSS transform 预览，不写 comp.x/y。
    //   主体和组员都通过 CSS transform 移动，零响应式触发、零模板 re-render。
    //   mouseup 时才一次性写 comp.x/y + pushHistory。
    s.lastX = nx
    s.lastY = ny
    store.setDragPreview(s.id, s.groupId, nx - s.startX, ny - s.startY)
  }

  function onDragUp() {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragUp)
    // 🔑 拖拽结束：移除全局 grabbing cursor
    document.body.classList.remove('bi-dragging')

    const s = dragSession
    dragSession = null
    if (!s) {
      clearSnapLines()
      resetSnapCache()
      store.abortGroupDrag()
      return
    }

    // 纯点击（未越过阈值）：不写历史，不调用 moveComponent
    if (!s.moved) {
      clearSnapLines()
      resetSnapCache()
      store.abortGroupDrag()
      return
    }

    // 🔑 性能优化：一次性提交。
    //   1. moveComponent 写主体最终 comp.x/y（无 opts：不触发 group 联动）
    //   2. setDragPreview 更新预览 delta 为最终值（mouseup 位置可能与最后一次 mousemove 不同）
    //   3. commitGroupDrag 把最终 delta 一次性应用到同组组员 + 清空预览
    //   必须在 pushHistory 之前，让历史快照包含所有组员的最终位置。
    store.moveComponent(s.id, s.lastX, s.lastY)
    store.setDragPreview(s.id, s.groupId, s.lastX - s.startX, s.lastY - s.startY)
    store.commitGroupDrag(s.id)

    clearSnapLines()
    resetSnapCache()
    store.pushHistory()
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const viewport = viewportRef.value
    const data = e.dataTransfer?.getData('application/json')
    if (!data || !viewport) return
    try {
      const meta = JSON.parse(data)
      const rect = viewport.getBoundingClientRect()
      const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
      const cx = x - (meta.defaultWidth ?? 100) / 2
      const cy = y - (meta.defaultHeight ?? 100) / 2
      store.addComponent(meta.type, cx, cy)
    } catch {
      /* ignore malformed drops */
    }
  }

  function handleResizeStart(e: MouseEvent, id: string, handlePosition: string) {
    const comp = store.getComponent?.(id) ?? store.components.find((c) => c.id === id)
    if (!comp) return
    e.preventDefault()
    e.stopPropagation()

    const scale = localScale.value
    const startX = e.clientX
    const startY = e.clientY
    const startComp = { ...comp }

    // 🔑 性能优化：RAF 批量写入。
    //   mousemove 事件频率远高于屏幕刷新率，每次直接写 comp.x/y/width/height 会触发
    //   Vue re-render + ECharts resize。用 RAF 合并同一帧内的多次 mousemove 为一次响应式写入。
    let rafId: number | null = null
    let pending = { x: startComp.x, y: startComp.y, width: startComp.width, height: startComp.height }

    function flush() {
      rafId = null
      store.moveComponent(id, pending.x, pending.y)
      store.resizeComponent(id, pending.width, pending.height)
    }

    function handleMouseMove(ev: MouseEvent) {
      const deltaX = (ev.clientX - startX) / scale
      const deltaY = (ev.clientY - startY) / scale
      let newX = startComp.x
      let newY = startComp.y
      let newWidth = startComp.width
      let newHeight = startComp.height
      if (handlePosition.includes('e')) newWidth = Math.max(10, startComp.width + deltaX)
      if (handlePosition.includes('w')) {
        newWidth = Math.max(10, startComp.width - deltaX)
        newX = startComp.x + (startComp.width - newWidth)
      }
      if (handlePosition.includes('s')) newHeight = Math.max(10, startComp.height + deltaY)
      if (handlePosition.includes('n')) {
        newHeight = Math.max(10, startComp.height - deltaY)
        newY = startComp.y + (startComp.height - newHeight)
      }
      if (store.canvas.snapToGrid) {
        const gs = store.canvas.gridSize
        newX = Math.round(newX / gs) * gs
        newY = Math.round(newY / gs) * gs
        newWidth = Math.round(newWidth / gs) * gs
        newHeight = Math.round(newHeight / gs) * gs
      }
      pending = { x: newX, y: newY, width: newWidth, height: newHeight }
      if (rafId === null) {
        rafId = requestAnimationFrame(flush)
      }
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      // 🔑 提交最后一帧 pending 尺寸（取消 pending RAF，避免延迟写入覆盖 mouseup 后的历史快照）
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
        flush()
      }
      if (activeResizeAbort === abortFn) {
        activeResizeAbort = null
      }
      // 🔑 拉伸结束 → 重置吸附缓存（组件尺寸变了，下次拖拽的吸附目标需重新计算）
      resetSnapCache()
      // 拉伸结束 → 才记录历史
      store.pushHistory()
    }

    function abortFn() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      // 🔑 取消 pending RAF，避免延迟写入覆盖回滚
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      // 回滚到原始尺寸
      store.moveComponent(id, startComp.x, startComp.y)
      store.resizeComponent(id, startComp.width, startComp.height)
      if (activeResizeAbort === abortFn) {
        activeResizeAbort = null
      }
      // 注意：abort 时不调用 pushHistory，保持原状态
    }

    activeResizeAbort = abortFn
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function abortActiveResize() {
    activeResizeAbort?.()
  }

  return {
    resizeHandles,
    handleSelect,
    handleWrapperMouseDown,
    handleDrop,
    handleResizeStart,
    abortActiveResize,
  }
}

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
  onSelectComponent?: (id: string | null) => void
}

/**
 * 画布交互逻辑：
 *  - 组件选中（click / vdr-activated / vdr-clicked）
 *  - 组件拖拽（vue3-drag-resize 的 dragging / dragstop）
 *  - 组件拉伸（自定义 8 方向 resize handles，mouseup 提交）
 *  - 组件库 drop 添加
 *  - 空格 / 中键平移
 *  - Escape 取消拉伸
 *
 * 历史记录策略：
 *  - 拖拽 / 拉伸过程中只更新组件位置，**不调用** pushHistory
 *  - 拖拽结束（dragstop）/ 拉伸结束（mouseup）**才调用** pushHistory
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
  /** 标记本次拖拽是否有实际移动（rect 与组件位置不同）。用于区分纯点击和真实拖拽。 */
  let wasDragging = false
  /**
   * 标记是否正在拉伸组件。
   * 拉伸期间 vue3-drag-resize 的 props watcher 会在 x/y/w/h 变化时
   * 自动调用 bodyDown→bodyMove→bodyUp，产生虚假的 dragging/dragstop 事件。
   * 此标志用于在 handleVdrDragging/handleVdrDragstop 中拦截这些虚假事件。
   */
  let isResizing = false

  function handleSelect(id: string | null) {
    store.selectComponent(id)
    onSelectComponent?.(id)
  }

  function handleWrapperMouseDown(e: MouseEvent, id: string) {
    if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
      startPan(e)
      return
    }
    handleSelect(id)
  }

  function handleVdrDragging(
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ) {
    const comp = store.components.find((c) => c.id === id)
    if (!comp || comp.locked) return

    // 🔑 撤销/重做恢复期间拦截：vue3-drag-resize 的 x/y watcher 会在 props 变化时
    //   自动触发 bodyDown→bodyMove→bodyUp，产生虚假的 dragging 事件。此处直接跳过，
    //   避免调用 moveComponent 导致刚恢复的位置被 snap-to-grid 拉偏。
    if (store.isRestoringNow()) return

    // 🔑 拉伸期间拦截：vue3-drag-resize 的 props watcher 会在 x/y/w/h 变化时
    //   自动触发 bodyDown→bodyMove，产生虚假的 dragging 事件。此处直接跳过。
    if (isResizing) return

    // 检测是否为实际拖拽
    if (Math.abs(rect.left - comp.x) > 0.01 || Math.abs(rect.top - comp.y) > 0.01) {
      wasDragging = true
    }

    let nx = rect.left
    let ny = rect.top

    // 只在实际拖拽时应用网格吸附和智能吸附
    if (store.canvas.snapToGrid && wasDragging) {
      const snapResult = snapRectToGuides(id, rect)
      nx = snapResult.rect.left
      ny = snapResult.rect.top
      applySnapLines(snapResult.hitsX, snapResult.hitsY)
      const gs = store.canvas.gridSize
      nx = Math.round(nx / gs) * gs
      ny = Math.round(ny / gs) * gs
    } else {
      clearSnapLines()
    }

    // 只更新位置，不调用 pushHistory
    store.moveComponent(id, nx, ny)
  }

  function handleVdrDragstop(
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ) {
    const comp = store.components.find((c) => c.id === id)
    if (!comp || comp.locked) return

    // 🔑 撤销/重做恢复期间拦截：vue3-drag-resize 的 x/y watcher 会在 this.$nextTick 中
    //   调用 bodyUp → emit 'dragstop'，这是恢复副作用而非用户拖拽，必须跳过，
    //   否则 pushHistory 会把 historyIndex 加回去，抵消 undo/redo。
    if (store.isRestoringNow()) return

    // 🔑 拉伸期间拦截：vue3-drag-resize 的 watcher 触发的虚假 dragstop 事件
    if (isResizing) return

    // 纯点击：不记录历史
    if (!wasDragging) {
      clearSnapLines()
      return
    }

    let nx = rect.left
    let ny = rect.top

    if (store.canvas.snapToGrid) {
      const snapResult = snapRectToGuides(id, rect)
      nx = snapResult.rect.left
      ny = snapResult.rect.top
      const gs = store.canvas.gridSize
      nx = Math.round(nx / gs) * gs
      ny = Math.round(ny / gs) * gs
    }
    if (Math.abs(nx - comp.x) > 0.0001 || Math.abs(ny - comp.y) > 0.0001) {
      store.moveComponent(id, nx, ny)
    }
    clearSnapLines()
    // 拖拽结束 → 才记录历史
    store.pushHistory()
    wasDragging = false
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
    const comp = store.components.find((c) => c.id === id)
    if (!comp) return
    e.preventDefault()
    e.stopPropagation()

    // 🔑 标记正在拉伸：阻止 vue3-drag-resize 的 props watcher 触发虚假事件
    isResizing = true

    const scale = localScale.value
    const startX = e.clientX
    const startY = e.clientY
    const startComp = { ...comp }

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
      // 只更新状态，不调用 pushHistory
      store.moveComponent(id, newX, newY)
      store.resizeComponent(id, newWidth, newHeight)
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (activeResizeAbort === abortFn) {
        activeResizeAbort = null
      }
      // 🔑 拉伸结束，解除拦截
      isResizing = false
      // 拉伸结束 → 才记录历史
      store.pushHistory()
    }

    function abortFn() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      // 回滚到原始尺寸
      store.moveComponent(id, startComp.x, startComp.y)
      store.resizeComponent(id, startComp.width, startComp.height)
      // 🔑 拉伸中止，解除拦截
      isResizing = false
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
    handleVdrDragging,
    handleVdrDragstop,
    handleDrop,
    handleResizeStart,
    abortActiveResize,
  }
}

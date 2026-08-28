import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { MIN_ZOOM, MAX_ZOOM } from '@/views/bi-editor/constants/canvas-constants'

/**
 * 画布缩放控制组合式函数
 */
export function useCanvasZoom() {
  const store = useBiEditorStore()

  /** 缩放选项（更丰富的常用档位） */
  const zoomOptions = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
    { label: '400%', value: 4 },
  ]

  /** 放大（按 0.1 步长，夹在 MIN/MAX_ZOOM 范围内） */
  function zoomIn() {
    const next = Math.min(MAX_ZOOM, +(store.canvas.zoom + 0.1).toFixed(2))
    store.setZoom(next)
  }

  /** 缩小（按 0.1 步长，夹在 MIN/MAX_ZOOM 范围内） */
  function zoomOut() {
    const next = Math.max(MIN_ZOOM, +(store.canvas.zoom - 0.1).toFixed(2))
    store.setZoom(next)
  }

  return {
    zoomOptions,
    zoomIn,
    zoomOut,
  }
}

/**
 * 键盘快捷键组合式函数
 */
export function useKeyboardShortcuts() {
  const store = useBiEditorStore()
  const isInputFocused = ref(false)

  /** 🔑 获取当前选中的 id 列表（多选优先，回退单选），避免多处重复判断 */
  function getSelectedIds(): string[] {
    if (store.selectedIds.length > 0) return [...store.selectedIds]
    return store.selectedId ? [store.selectedId] : []
  }

  /** 🔑 批量删除（保证最后清一次选中并写入一次历史） */
  function deleteSelection() {
    const ids = getSelectedIds()
    if (ids.length === 0) return
    ids.forEach((id) => store.removeComponent(id))
    store.clearSelection()
  }
  /** 🔑 批量复制（duplicateComponent 内部会自动 pushHistory，多选时最后清一次 dirty 即可） */
  function duplicateSelection() {
    const ids = getSelectedIds()
    if (ids.length === 0) return
    ids.forEach((id) => store.duplicateComponent(id))
  }

  function handleKeyDown(e: KeyboardEvent) {
    // 如果焦点在输入框中，不触发快捷键（contentEditable 也跳过）
    const target = e.target as HTMLElement
    const tag = target?.tagName
    const isEditable =
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable
    if (isEditable) {
      return
    }

    const ctrlOrMeta = e.ctrlKey || e.metaKey

    // Ctrl+Z 撤销
    if (ctrlOrMeta && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      store.undo()
      return
    }

    // Ctrl+Shift+Z 或 Ctrl+Y 重做
    if (ctrlOrMeta && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault()
      store.redo()
      return
    }

    // 🔑 Ctrl+A 全选组件
    if (ctrlOrMeta && e.key === 'a') {
      if (store.components.length > 0) {
        e.preventDefault()
        store.selectByRect(
          { x: 0, y: 0, width: store.canvas.width, height: store.canvas.height },
          false,
        )
      }
      return
    }

    // Delete/Backspace 删除选中（单选 + 多选）
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const ids = getSelectedIds()
      if (ids.length === 0) return
      // 🔑 若有锁定组件，拦截删除（至少一个可删组件才 preventDefault）
      const deletable = ids.filter((id) => {
        const c = store.components.find((x) => x.id === id)
        return !!c && !c.locked
      })
      if (deletable.length === 0) return
      e.preventDefault()
      deletable.forEach((id) => store.removeComponent(id))
      store.clearSelection()
      return
    }

    // 🔑 Ctrl+X 剪切 = 复制 + 删除
    if (ctrlOrMeta && e.key === 'x') {
      const ids = getSelectedIds()
      if (ids.length === 0) return
      e.preventDefault()
      // 模块内剪贴板是同步写入的，先同步完成删除即可
      store.copyToClipboard()
      deleteSelection()
      return
    }

    // 🔑 Ctrl+S 保存看板 / Ctrl+Shift+S 另存为
    //    通过触发 customEvent('bi-editor:save-as') 通知 HeaderToolbar 父层，避免依赖 useRouter
    if (ctrlOrMeta && e.key === 's') {
      e.preventDefault()
      if (e.shiftKey) {
        window.dispatchEvent(new CustomEvent('bi-editor:save-as'))
      } else {
        window.dispatchEvent(new CustomEvent('bi-editor:save'))
      }
      return
    }

    // 🔑 Ctrl+0：fit-to-screen（居中显示整张画布）
    if (ctrlOrMeta && (e.key === '0' || e.key === 'Zero' || e.code === 'Digit0')) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('bi-editor:fit-to-screen'))
      return
    }

    // Ctrl+G 组合（分组）/ Ctrl+Shift+G 取消组合
    if (ctrlOrMeta && e.key === 'g') {
      e.preventDefault()
      if (e.shiftKey) {
        if (store.canUngroup) store.ungroupSelection()
      } else {
        if (store.canGroup) store.groupSelection()
      }
      return
    }

    // Ctrl+D 原位复制选中（单选 + 多选）
    if (ctrlOrMeta && e.key === 'd') {
      const ids = getSelectedIds()
      if (ids.length === 0) return
      e.preventDefault()
      duplicateSelection()
      return
    }

    // 🔑 Ctrl+C 复制选中组件到剪贴板（系统+模块内双写）
    if (ctrlOrMeta && e.key === 'c') {
      const ids = getSelectedIds()
      if (ids.length === 0) return
      e.preventDefault()
      // 异步写入剪贴板不阻塞键盘事件
      store.copyToClipboard()
      return
    }

    // 🔑 Ctrl+V 从剪贴板粘贴组件
    if (ctrlOrMeta && e.key === 'v') {
      e.preventDefault()
      store.pasteFromClipboard()
      return
    }

    // 🔑 方向键微调：单选/多选同时按相同 step 移动
    //   - 普通方向键：1px
    //   - Shift+方向键：10px → pushHistory
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown'
    ) {
      const ids = getSelectedIds()
      if (ids.length === 0) return
      e.preventDefault()
      const step = e.shiftKey ? 10 : 1
      const gs = store.canvas.snapToGrid ? store.canvas.gridSize : 0

      // 单选：走 store.moveComponent，分组联动已在其中实现
      // 多选：为避免重复移动（成员 moveComponent 里的分组联动会重复），此处直接计算并直接赋值
      const isMulti = ids.length > 1
      if (isMulti) {
        for (const id of ids) {
          const comp = store.components.find((c) => c.id === id)
          if (!comp || comp.locked) continue
          let nx = comp.x
          let ny = comp.y
          switch (e.key) {
            case 'ArrowLeft':
              nx -= step
              break
            case 'ArrowRight':
              nx += step
              break
            case 'ArrowUp':
              ny -= step
              break
            case 'ArrowDown':
              ny += step
              break
          }
          if (gs) {
            nx = Math.round(nx / gs) * gs
            ny = Math.round(ny / gs) * gs
          }
          comp.x = nx
          comp.y = ny
        }
        store.markDirty?.()
      } else {
        const id = ids[0]
        const comp = store.components.find((c) => c.id === id)
        if (!comp || comp.locked) return
        let nx = comp.x
        let ny = comp.y
        switch (e.key) {
          case 'ArrowLeft':
            nx -= step
            break
          case 'ArrowRight':
            nx += step
            break
          case 'ArrowUp':
            ny -= step
            break
          case 'ArrowDown':
            ny += step
            break
        }
        if (gs) {
          nx = Math.round(nx / gs) * gs
          ny = Math.round(ny / gs) * gs
        }
        store.moveComponent(id, nx, ny, { linkGroup: true })
      }
      if (step >= 10) store.pushHistory()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return { isInputFocused }
}

/**
 * 网格吸附计算组合式函数
 */
export function useGridSnap() {
  const store = useBiEditorStore()

  /** 将坐标吸附到网格 */
  function snapToGrid(value: number, size?: number): number {
    const gridSize = size ?? store.canvas.gridSize
    if (!store.canvas.snapToGrid) {
      return value
    }
    return Math.round(value / gridSize) * gridSize
  }

  /** 将尺寸吸附到网格 */
  function snapSizeToGrid(value: number, size?: number): number {
    const gridSize = size ?? store.canvas.gridSize
    if (!store.canvas.snapToGrid) {
      return value
    }
    return Math.max(gridSize, Math.round(value / gridSize) * gridSize)
  }

  return { snapToGrid, snapSizeToGrid }
}

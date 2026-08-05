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

  function handleKeyDown(e: KeyboardEvent) {
    // 如果焦点在输入框中，不触发快捷键
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return
    }

    const ctrlOrMeta = e.ctrlKey || e.metaKey

    // Ctrl+Z 撤销
    if (ctrlOrMeta && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      store.undo()
    }

    // Ctrl+Shift+Z 或 Ctrl+Y 重做
    if (ctrlOrMeta && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault()
      store.redo()
    }

    // Delete/Backspace 删除选中组件
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (store.selectedId) {
        e.preventDefault()
        store.removeComponent(store.selectedId)
      }
    }

    // Ctrl+D 复制选中组件
    if (ctrlOrMeta && e.key === 'd') {
      if (store.selectedId) {
        e.preventDefault()
        store.duplicateComponent(store.selectedId)
      }
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

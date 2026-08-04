import { type Ref } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import type { RectLike, SnapResult } from '@/views/bi-editor/composables/useSmartGuides'

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

export interface UseCanvasInteractionDeps {
  localScale: Ref<number>
  isSpacePressed: Ref<boolean>
  isPanning: Ref<boolean>
  viewportRef: Ref<HTMLElement | null>
  startPan: (e: MouseEvent) => void
  screenToWorld: (sx: number, sy: number) => { x: number; y: number }
  snapRectToGuides: (id: string, rect: RectLike, threshold?: number) => SnapResult
  applySnapLines: (hitsX: number[], hitsY: number[]) => void
  clearSnapLines: () => void
  onSelectComponent?: (id: string | null) => void
}

/**
 * Canvas component interaction handlers:
 *  - Click / mousedown selection wrapper
 *  - VueDragResize dragging + dragstop (smart guides + grid snap + history commit)
 *  - Palette drop (new component creation)
 *  - Custom 8-direction resize handles
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

  function handleSelect(id: string) {
    store.selectComponent(id)
    onSelectComponent?.(id)
  }

  function handleWrapperMouseDown(e: MouseEvent, id: string) {
    if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
      startPan(e)
      e.stopPropagation()
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
    let nx = rect.left
    let ny = rect.top

    const snapResult = snapRectToGuides(id, rect)
    nx = snapResult.rect.left
    ny = snapResult.rect.top
    applySnapLines(snapResult.hitsX, snapResult.hitsY)

    if (store.canvas.snapToGrid) {
      const gs = store.canvas.gridSize
      nx = Math.round(nx / gs) * gs
      ny = Math.round(ny / gs) * gs
    }

    store.moveComponent(id, nx, ny)
  }

  function handleVdrDragstop(
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ) {
    const comp = store.components.find((c) => c.id === id)
    if (!comp || comp.locked) return
    let nx = rect.left
    let ny = rect.top

    const snapResult = snapRectToGuides(id, rect)
    nx = snapResult.rect.left
    ny = snapResult.rect.top

    if (store.canvas.snapToGrid) {
      const gs = store.canvas.gridSize
      nx = Math.round(nx / gs) * gs
      ny = Math.round(ny / gs) * gs
    }
    if (Math.abs(nx - comp.x) > 0.0001 || Math.abs(ny - comp.y) > 0.0001) {
      store.moveComponent(id, nx, ny)
    }
    clearSnapLines()
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
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const { x, y } = screenToWorld(sx, sy)
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
      store.moveComponent(id, newX, newY)
      store.resizeComponent(id, newWidth, newHeight)
    }
    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (activeResizeAbort === abortFn) {
        activeResizeAbort = null
      }
      store.pushHistory()
    }
    function abortFn() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      store.moveComponent(id, startComp.x, startComp.y)
      store.resizeComponent(id, startComp.width, startComp.height)
      store.pushHistory()
      if (activeResizeAbort === abortFn) {
        activeResizeAbort = null
      }
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

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface UseCanvasPanOptions {
  localOffset: Ref<{ x: number; y: number }>
  /** Escape 回调（例如中止正在进行的 resize） */
  onEscape?: () => void
}

/** 画布平移（空格 + 拖拽 / 中键拖拽）与键盘状态 */
export function useCanvasPan(options: UseCanvasPanOptions) {
  const { localOffset, onEscape } = options

  const isSpacePressed = ref(false)
  const isMiddlePressed = ref(false)
  const isPanning = ref(false)
  let panStartPos = { x: 0, y: 0 }
  let panStartOffset = { x: 0, y: 0 }
  let panMouseMoveHandler: ((e: MouseEvent) => void) | null = null
  let panMouseUpHandler: ((e?: MouseEvent) => void) | null = null

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
      onEscape?.()
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      isSpacePressed.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onBeforeUnmount(() => {
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
    isSpacePressed,
    isMiddlePressed,
    isPanning,
    startPan,
    abortPan,
    handleContainerMouseDown,
  }
}

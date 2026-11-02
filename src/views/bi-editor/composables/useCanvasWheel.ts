import { onBeforeUnmount, type Ref } from 'vue'

export interface UseCanvasWheelOptions {
  viewportRef: Ref<HTMLElement | null>
  localScale: Ref<number>
  localOffset: Ref<{ x: number; y: number }>
  setZoomLocal: (next: number, anchor?: { screenX: number; screenY: number }) => void
}

/**
 * 滚轮平移 / Ctrl+滚轮缩放。
 * 🔑 rAF 节流：trackpad 轮事件可高达 120Hz，用 rAF + delta 累积合并同帧更新。
 */
export function useCanvasWheel(options: UseCanvasWheelOptions) {
  const { viewportRef, localScale, localOffset, setZoomLocal } = options

  let wheelRafId: number | null = null
  let wheelBuffer = {
    deltaX: 0,
    deltaY: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    anchorX: 0,
    anchorY: 0,
    hasAnchor: false,
  }

  function resetWheelBuffer() {
    wheelBuffer = {
      deltaX: 0,
      deltaY: 0,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      anchorX: 0,
      anchorY: 0,
      hasAnchor: false,
    }
  }

  function flushWheel() {
    wheelRafId = null
    const buf = wheelBuffer

    if (buf.ctrlKey || buf.metaKey) {
      if (buf.hasAnchor) {
        const factor = Math.exp(-buf.deltaY * 0.0015)
        setZoomLocal(localScale.value * factor, {
          screenX: buf.anchorX,
          screenY: buf.anchorY,
        })
      }
    } else {
      const scrollSpeed = 1.5
      if (buf.shiftKey) {
        localOffset.value = {
          ...localOffset.value,
          x: localOffset.value.x - buf.deltaY * scrollSpeed,
        }
      } else {
        const hasHorizontal = Math.abs(buf.deltaX) > Math.abs(buf.deltaY)
        localOffset.value = {
          x: localOffset.value.x - (hasHorizontal ? buf.deltaX : 0) * scrollSpeed,
          y: localOffset.value.y - (hasHorizontal ? 0 : buf.deltaY) * scrollSpeed,
        }
      }
    }

    resetWheelBuffer()
  }

  function handleWheel(e: WheelEvent) {
    const viewport = viewportRef.value
    if (!viewport) return

    // 🔑 滚轮交互隔离：仅当滚轮发生在「选中态组件」内容区内部时交给组件（如 ECharts dataZoom）
    if (
      e.target &&
      (e.target as HTMLElement).closest?.(
        '.canvas-component-wrapper-inner.selected.has-dz .component-content',
      )
    ) {
      e.preventDefault()
      return
    }

    e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey || e.metaKey) {
      if (!wheelBuffer.hasAnchor) {
        const rect = viewport.getBoundingClientRect()
        wheelBuffer.anchorX = e.clientX - rect.left
        wheelBuffer.anchorY = e.clientY - rect.top
        wheelBuffer.hasAnchor = true
      }
      wheelBuffer.ctrlKey = true
      wheelBuffer.metaKey = e.metaKey
      wheelBuffer.deltaY += e.deltaY
    } else {
      wheelBuffer.shiftKey = e.shiftKey
      if (e.shiftKey) {
        wheelBuffer.deltaY += e.deltaY
      } else {
        const hasHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
        if (hasHorizontal) {
          wheelBuffer.deltaX += e.deltaX
        } else {
          wheelBuffer.deltaY += e.deltaY
        }
      }
    }

    if (wheelRafId !== null) return
    wheelRafId = requestAnimationFrame(flushWheel)
  }

  onBeforeUnmount(() => {
    if (wheelRafId !== null) {
      cancelAnimationFrame(wheelRafId)
      wheelRafId = null
    }
  })

  return { handleWheel }
}

declare module 'vue3-drag-resize' {
  import type { DefineComponent } from 'vue'
  export interface VueDragResizeProps {
    isActive?: boolean
    preventActiveBehavior?: boolean
    parentW?: number
    parentH?: number
    parentScaleX?: number
    parentScaleY?: number
    isDraggable?: boolean
    isResizable?: boolean
    parentLimitation?: boolean
    snapToGrid?: boolean
    gridX?: number
    gridY?: number
    aspectRatio?: boolean
    w?: number | string
    h?: number | string
    minw?: number
    minh?: number
    x?: number
    y?: number
    z?: number | string
    stickSize?: number
    sticks?: string[]
    axis?: 'x' | 'y' | 'both' | 'none'
    dragHandle?: string
    dragCancel?: string
    contentClass?: string
  }
  export interface VueDragResizeRect {
    left: number
    top: number
    width: number
    height: number
  }
  const VueDragResize: DefineComponent<VueDragResizeProps>
  export default VueDragResize
}

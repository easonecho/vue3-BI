/**
 * BI 编辑器类型定义
 */

/** 组件类型 */
export type ComponentType =
  | 'text'
  | 'image'
  | 'rect'
  | 'line'
  | 'bar-chart'
  | 'line-chart'
  | 'pie-chart'
  | 'scatter-chart'
  | 'table'
  | 'number'
  | 'gauge'
  | 'progress'
  | 'indicator'

/** 组件分类 */
export type ComponentCategory = 'basic' | 'chart' | 'data' | 'info'

/** 画布中的组件实例 */
export interface ComponentInstance {
  /** 唯一 ID */
  id: string
  /** 组件类型 */
  type: ComponentType
  /** 组件名称 */
  name: string
  /** 位置 X */
  x: number
  /** 位置 Y */
  y: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 层级 (z-index) */
  zIndex: number
  /** 是否可见 */
  visible: boolean
  /** 是否锁定 */
  locked: boolean
  /** 属性配置 */
  props: Record<string, any>
  /** 样式配置 */
  style: Record<string, any>
}

/** 组件元信息 (定义面板中展示的组件模板) */
export interface ComponentMeta {
  type: ComponentType
  name: string
  category: ComponentCategory
  icon: string
  defaultWidth: number
  defaultHeight: number
  defaultProps: Record<string, any>
  defaultStyle: Record<string, any>
}

/** 画布状态 */
export interface CanvasState {
  /** 画布宽度 */
  width: number
  /** 画布高度 */
  height: number
  /** 缩放比例 */
  zoom: number
  /** 背景色 */
  backgroundColor: string
  /** 背景图片 */
  backgroundImage: string
  /** 是否显示网格 */
  showGrid: boolean
  /** 网格大小 */
  gridSize: number
  /** 是否开启网格吸附 */
  snapToGrid: boolean
  /** 是否显示标尺 */
  showRuler: boolean
  /** 是否显示辅助线 */
  showGuides: boolean
  /** 画布滚动位置 */
  scrollX: number
  scrollY: number
}

/** 辅助线 */
export interface GuideLine {
  id: string
  /** 'horizontal' | 'vertical' */
  direction: 'horizontal' | 'vertical'
  /** 位置 (像素) */
  position: number
}

/** 历史记录快照 */
export interface HistorySnapshot {
  components: ComponentInstance[]
  canvas: CanvasState
  selectedId: string | null
}

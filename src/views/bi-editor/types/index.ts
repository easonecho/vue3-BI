/**
 * BI 编辑器类型定义
 */

/**
 * 🔑 组件类型 —— 现为 string 别名，配合 registry.ts 自动扫描使用。
 *   新增组件不再需要手动加联合字面量成员。
 *
 *   如需恢复强类型校验，只需改成：
 *   ```ts
 *   import type { componentDefinitions } from '@/views/bi-editor/component-defs'
 *   export type ComponentType = keyof typeof componentDefinitions
 *   ```
 */
import type { componentDefinitions } from '@/views/bi-editor/component-defs'
export type ComponentType = keyof typeof componentDefinitions

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
  /** 🔑 数据绑定配置:数据集来源,为路线 B(executeDataset + 前端字段映射) */
  dataSource: { datasetId: number | null }
  /** 🔑 字段映射配置:不同图表类型所需字段槽位不同(如 bar: {categoryField, valueFields}) */
  dataConfig: Record<string, unknown>
  /**
   * 🔑 分组 ID（扁平分组方案）：
   *   - 多个组件拥有相同的 groupId 即视为同一组
   *   - 选中任一组员 → 自动全组选中
   *   - 拖动任一组员 → 其他组员按相同 delta 跟随移动
   *   - 未分组 = undefined
   */
  groupId?: string
  /**
   * 🔑 分组容器名称（仅当此实例是"分组根"时存在；目前保留冗余，方便未来扩展容器节点）
   */
  groupName?: string
  /**
   * 🔑 分组框冻结尺寸（快照，以分组创建/最后一次明确重建时的包围盒为准）：
   *   - 存在时：GroupBox 绘制用该固定 x/y/width/height，不再随组员对齐/分布而重算边界
   *   - 不存在时（老数据 / 未分组）：退回实时包围盒计算（兼容旧项目）
   *   ⚠️ x/y 是相对画布世界坐标的绝对位置，不是相对偏移
   *   ⚠️ 分组整体拖拽时：所有组员 x/y + delta，本快照 x/y 也应同步 + delta，保证 GroupBox 跟随
   *   ⚠️ 加/减组员 / 解散重分组时：重建快照（让框重新反映实际包含范围）
   */
  fixedGroupBox?: { x: number; y: number; width: number; height: number }
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
  guides: GuideLine[]
  selectedId: string | null
  /** 🔑 多选集合的快照：undo/redo 后正确恢复选中态，保持分布/对齐按钮可用性 */
  selectedIds: string[]
}

/** 看板持久化结构(存入 Dashboard.layout) */
export interface DashboardLayout {
  /** 结构版本号,便于未来 schema 迁移 */
  version: string
  /** 画布状态 */
  canvas: CanvasState
  /** 组件实例列表 */
  components: ComponentInstance[]
  /** 辅助线列表 */
  guides: GuideLine[]
}

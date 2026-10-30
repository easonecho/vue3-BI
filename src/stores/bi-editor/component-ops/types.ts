import type { ComputedRef, Ref } from 'vue'
import type { ComponentInstance, ComponentType } from '@/views/bi-editor/types'

/**
 * 🔑 moveComponent 的联动模式：
 *   - undefined / {} ：仅移动目标组件本身，不联动其他组员（resize、对齐等场景）
 *   - { linkGroup: true } ：同步联动 —— 立即把 delta 加到所有非锁定的同组成员 x/y 上
 *     （箭头键微调等"一次性离散移动"场景，N 个组员各触发一次 VDR watcher，
 *      handleVdrDragging 的 delta=0 早退 + handleVdrDragstop 的 wasDragging=false 早退
 *      已经能消化掉虚假事件，开销可接受）
 *   - { dragPreview: true } ：预览联动 —— 不改写其他组员的 x/y，只把累计 delta 记到
 *     groupDragPreview，由组员通过 CSS transform 视觉跟随；dragstop 时调
 *     commitGroupDrag 一次性提交。专用于鼠标拖拽，避免每次 mousemove 触发 N 个
 *     VDR x/y watcher → bodyDown/bodyMove/bodyUp → dragging/dragstop 的连锁。
 */
export interface MoveOpts {
  linkGroup?: boolean
  dragPreview?: boolean
}

/** 🔑 分组包围盒：选中某个分组时，用于绘制统一的 GroupBox 边框 + 空白区域命中拖拽 */
export interface GroupBounds {
  groupId: string
  x: number
  y: number
  width: number
  height: number
  memberIds: string[]
}

/**
 * 🔑 组件操作的依赖上下文（由 useComponentOperations 注入）。
 *   各拆分模块只通过该上下文读写 store 状态，不引入隐式全局依赖。
 */
export interface OpsDeps {
  components: Ref<ComponentInstance[]>
  selectedId: Ref<string | null>
  selectedIds: Ref<string[]>
  pushHistory: () => void
  /** 标记未保存改动（用于 moveComponent/resizeComponent 等不调用 pushHistory 的高频操作） */
  markDirty: () => void
}

/** 🔑 组件索引 & 选中派生状态（O(1) 按 id 查找） */
export interface ComponentIndexApi {
  componentMap: ComputedRef<Map<string, ComponentInstance>>
  getComponent: (id: string) => ComponentInstance | undefined
  selectedComponent: ComputedRef<ComponentInstance | null>
  selectedIdSet: ComputedRef<Set<string>>
  selectedComponents: ComputedRef<ComponentInstance[]>
  layerList: ComputedRef<ComponentInstance[]>
}

/** 组件操作 API（用于类型约束与文档） */
export interface ComponentOperationsApi {
  selectedComponent: ComputedRef<ComponentInstance | null>
  /** 多选：所有选中组件实例数组（按 zIndex 排序） */
  selectedComponents: ComputedRef<ComponentInstance[]>
  layerList: ComputedRef<ComponentInstance[]>
  /** 🔑 O(1) 组件查找索引 */
  componentMap: ComputedRef<Map<string, ComponentInstance>>
  /** 🔑 选中分组对应的包围盒列表（≥1：选中了 group 才会有） */
  selectedGroupBounds: ComputedRef<GroupBounds[]>
  generateId: () => string
  createComponent: (type: ComponentType, x: number, y: number) => ComponentInstance
  addComponent: (type: ComponentType, x: number, y: number) => ComponentInstance
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void
  moveComponent: (id: string, x: number, y: number, opts?: MoveOpts) => void
  resizeComponent: (id: string, width: number, height: number) => void
  setComponentZIndex: (id: string, zIndex: number) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  moveUp: (id: string) => void
  moveDown: (id: string) => void
  removeComponent: (id: string) => void
  duplicateComponent: (id: string) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  selectComponent: (id: string | null) => void
  /** 多选：累加选中（Shift+Click 用），toggle=true 时若已选中则取消 */
  selectComponentAccum: (id: string, toggle?: boolean) => void
  /** 多选：按矩形框选 */
  selectByRect: (rect: { x: number; y: number; width: number; height: number }, additive?: boolean) => void
  /** 取消所有选中（selectedId = null + selectedIds 清空） */
  clearSelection: () => void
  /** 🔑 拖拽预览：当前正在拖拽的分组信息 + 累计位移（world 坐标） */
  groupDragPreview: Ref<{ groupId: string; dx: number; dy: number; draggedId: string } | null>
  /** 🔑 拖拽中：只更新 CSS transform 预览，不写 comp.x/y（零响应式触发） */
  setDragPreview: (draggedId: string, groupId: string | undefined, dx: number, dy: number) => void
  /** 🔑 拖拽结束：把累计 delta 一次性应用到所有同组其他组员，并清空预览 */
  commitGroupDrag: (id: string) => void
  /** 🔑 拖拽中止/早退：清空预览（不改任何组员位置） */
  abortGroupDrag: () => void
  /** 🔑 O(1) 按 id 获取组件实例（Map 索引，替代 find） */
  getComponent: (id: string) => ComponentInstance | undefined
  /** 🔑 判断组件 id 是否属于「当前被选中的分组」——用于隐藏组员个人选中边框 */
  isInSelectedGroup: (id: string) => boolean
  /** 🔑 命中测试：画布世界坐标是否落在某个选中分组的包围盒内，且未命中任何组员（返回 groupId 或 null） */
  hitTestSelectedGroupBlank: (wx: number, wy: number) => { groupId: string; masterId: string } | null
  /** 🔑 commitGroupDrag 期间（含 VDR watcher nextTick bodyUp）是否在执行，是则所有 dragging/dragstop/clicked/activated 事件都应拦截 */
  isCommittingGroupDragNow: () => boolean
  canBringToFront: ComputedRef<boolean>
  canSendToBack: ComputedRef<boolean>
  canMoveUp: ComputedRef<boolean>
  canMoveDown: ComputedRef<boolean>
}

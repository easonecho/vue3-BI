import type { Ref } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { createComponentIndex } from './component-ops/component-index'
import { createDragPreview } from './component-ops/drag-preview'
import { createGroupBounds } from './component-ops/group-bounds'
import { createComponentCrud } from './component-ops/component-crud'
import { createLayerOrder } from './component-ops/layer-order'
import { createSelection } from './component-ops/selection'
import { createAlign } from './component-ops/align'
import { createGroupSelection } from './component-ops/group-selection'
import type { OpsDeps } from './component-ops/types'

export type { ComponentOperationsApi, GroupBounds, MoveOpts } from './component-ops/types'

/**
 * 🔑 组件操作组合根。
 *
 *   拆分后的职责边界（均位于 ./component-ops/）：
 *   - component-index：O(1) 组件索引 + 选中派生状态
 *   - drag-preview：拖拽预览 / moveComponent / 提交与中止 / resize
 *   - group-bounds：选中分组包围盒 / 命中测试 / expandGroup
 *   - component-crud：新增 / 更新 / 删除 / 复制 / 显隐 / 锁定
 *   - layer-order：层级（zIndex）操作与禁用状态
 *   - selection：单选 / Shift 累加 / 框选 / 清空
 *   - align：对齐 / 分布
 *   - group-selection：分组 / 取消分组
 *
 *   ⚠️ 对外签名与返回对象键必须保持不变：stores/bi-editor/index.ts 会解构这些 API，
 *      且会覆盖 alignHCenter/alignRight/alignVCenter/alignBottom（单选时需画布宽度）。
 */
export function useComponentOperations(
  components: Ref<ComponentInstance[]>,
  selectedId: Ref<string | null>,
  pushHistory: () => void,
  /** 标记未保存改动（用于 moveComponent/resizeComponent 等不调用 pushHistory 的高频操作） */
  markDirty: () => void,
  /** 多选 ID 集合（用于 Shift+Click、框选、对齐等操作） */
  selectedIds: Ref<string[]>,
) {
  const deps: OpsDeps = { components, selectedId, selectedIds, pushHistory, markDirty }

  const index = createComponentIndex(deps)
  const drag = createDragPreview(deps, index)
  const bounds = createGroupBounds(deps, index)
  const crud = createComponentCrud(deps, index)
  const layer = createLayerOrder(deps, index)
  const selection = createSelection(deps, index, bounds.expandGroup)
  const align = createAlign(deps, index)
  const groupSelection = createGroupSelection(deps, align.getAlignTargets)

  return {
    selectedComponent: index.selectedComponent,
    selectedComponents: index.selectedComponents,
    selectedIdSet: index.selectedIdSet,
    componentMap: index.componentMap,
    getComponent: index.getComponent,
    layerList: index.layerList,
    // 🔑 分组包围盒 & 命中测试（统一 GroupBox 边框 + 空白区整体拖拽）
    selectedGroupBounds: bounds.selectedGroupBounds,
    isInSelectedGroup: bounds.isInSelectedGroup,
    hitTestSelectedGroupBlank: bounds.hitTestSelectedGroupBlank,
    isCommittingGroupDragNow: drag.isCommittingGroupDragNow,
    generateId: crud.generateId,
    createComponent: crud.createComponent,
    addComponent: crud.addComponent,
    updateComponent: crud.updateComponent,
    moveComponent: drag.moveComponent,
    resizeComponent: drag.resizeComponent,
    setComponentZIndex: layer.setComponentZIndex,
    bringToFront: layer.bringToFront,
    sendToBack: layer.sendToBack,
    moveUp: layer.moveUp,
    moveDown: layer.moveDown,
    removeComponent: crud.removeComponent,
    duplicateComponent: crud.duplicateComponent,
    toggleVisibility: crud.toggleVisibility,
    toggleLock: crud.toggleLock,
    selectComponent: selection.selectComponent,
    selectComponentAccum: selection.selectComponentAccum,
    selectByRect: selection.selectByRect,
    clearSelection: selection.clearSelection,
    // 🔑 分组拖拽预览
    groupDragPreview: drag.groupDragPreview,
    activeDragGroupId: drag.activeDragGroupId,
    activeDragId: drag.activeDragId,
    setDragPreview: drag.setDragPreview,
    commitGroupDrag: drag.commitGroupDrag,
    abortGroupDrag: drag.abortGroupDrag,
    alignLeft: align.alignLeft,
    alignHCenter: align.alignHCenter,
    alignRight: align.alignRight,
    alignTop: align.alignTop,
    alignVCenter: align.alignVCenter,
    alignBottom: align.alignBottom,
    distributeHorizontal: align.distributeHorizontal,
    distributeVertical: align.distributeVertical,
    // 分组
    canGroup: groupSelection.canGroup,
    canUngroup: groupSelection.canUngroup,
    groupSelection: groupSelection.groupSelection,
    ungroupSelection: groupSelection.ungroupSelection,
    canBringToFront: layer.canBringToFront,
    canSendToBack: layer.canSendToBack,
    canMoveUp: layer.canMoveUp,
    canMoveDown: layer.canMoveDown,
  }
}

import { computed, type ComputedRef } from 'vue'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { ComponentInstance } from '@/views/bi-editor/types'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

export interface HeaderSelectionApi {
  selectedIds: ComputedRef<string[]>
  hasSelection: ComputedRef<boolean>
  hasMulti: ComputedRef<boolean>
  duplicateSelection: () => void
  deleteSelection: () => void
  bringSelectionToFront: () => void
  sendSelectionToBack: () => void
  moveSelectionUp: () => void
  moveSelectionDown: () => void
}

/**
 * 🔑 顶栏「选中组件操作」：多选优先、回退单选。
 *
 * 从 HeaderToolbar 抽出：
 *   - selectedIds / hasSelection / hasMulti 派生状态
 *   - 批量复制 / 批量删除（忽略锁定组件）
 *   - 图层顺序（置顶/置底/上移/下移）按 z-index 依次操作，
 *     保持选中集合内部的相对视觉顺序。
 */
export function useHeaderSelection(store: BiEditorStore): HeaderSelectionApi {
  /** 🔑 当前选中 id 列表（多选 > 单选）供 disabled 与批量操作共用 */
  const selectedIds = computed(() =>
    store.selectedIds.length > 0
      ? [...store.selectedIds]
      : store.selectedId
        ? [store.selectedId]
        : [],
  )
  const hasSelection = computed(() => selectedIds.value.length > 0)
  const hasMulti = computed(() => selectedIds.value.length >= 2)

  /** 选中集合中可操作（未锁定）的组件，按 zIndex 排序后统一执行层级操作 */
  function editableSelection(direction: 'asc' | 'desc'): ComponentInstance[] {
    return [...selectedIds.value]
      .map((id) => store.components.find((c) => c.id === id))
      .filter((c): c is ComponentInstance => !!c && !c.locked)
      .sort((a, b) => (direction === 'asc' ? a.zIndex - b.zIndex : b.zIndex - a.zIndex))
  }

  function duplicateSelection() {
    for (const id of selectedIds.value) store.duplicateComponent(id)
  }

  function deleteSelection() {
    const deletable = selectedIds.value.filter((id) => {
      const c = store.components.find((x) => x.id === id)
      return !!c && !c.locked
    })
    deletable.forEach((id) => store.removeComponent(id))
    if (deletable.length > 0) store.clearSelection()
  }

  /** 按 z-index 从小到大依次置顶，保证最后置顶的是 z-index 最大的（保持视觉序） */
  function bringSelectionToFront() {
    editableSelection('asc').forEach((c) => store.bringToFront(c.id))
  }

  /** 按 z-index 从大到小依次置底 */
  function sendSelectionToBack() {
    editableSelection('desc').forEach((c) => store.sendToBack(c.id))
  }

  /** 按 z-index 从大到小依次上移 */
  function moveSelectionUp() {
    editableSelection('desc').forEach((c) => store.moveUp(c.id))
  }

  /** 按 z-index 从小到大依次下移 */
  function moveSelectionDown() {
    editableSelection('asc').forEach((c) => store.moveDown(c.id))
  }

  return {
    selectedIds,
    hasSelection,
    hasMulti,
    duplicateSelection,
    deleteSelection,
    bringSelectionToFront,
    sendSelectionToBack,
    moveSelectionUp,
    moveSelectionDown,
  }
}

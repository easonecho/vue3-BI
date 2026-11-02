import { describe, it, expect, vi } from 'vitest'
import { useHeaderSelection } from './useHeaderSelection'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { ComponentInstance } from '@/views/bi-editor/types'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

function makeComponent(id: string, zIndex: number, locked = false): ComponentInstance {
  return {
    id,
    type: 'bar-chart',
    name: id,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    zIndex,
    visible: true,
    locked,
    props: {},
    style: {},
    dataSource: { datasetId: null },
    dataConfig: {},
  }
}

interface StoreOptions {
  selectedIds?: string[]
  selectedId?: string | null
  canBringToFront?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  canSendToBack?: boolean
}

function makeStore(options: StoreOptions = {}) {
  const store = {
    components: [
      makeComponent('a', 1),
      makeComponent('b', 3),
      makeComponent('c', 2),
      makeComponent('locked', 4, true),
    ],
    selectedIds: options.selectedIds ?? [],
    selectedId: options.selectedId ?? null,
    canBringToFront: options.canBringToFront ?? true,
    canMoveUp: options.canMoveUp ?? true,
    canMoveDown: options.canMoveDown ?? true,
    canSendToBack: options.canSendToBack ?? true,
    duplicateComponent: vi.fn(),
    removeComponent: vi.fn(),
    clearSelection: vi.fn(),
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    moveUp: vi.fn(),
    moveDown: vi.fn(),
  }
  return {
    store: store as unknown as BiEditorStore,
    raw: store,
    api: useHeaderSelection(store as unknown as BiEditorStore),
  }
}

describe('useHeaderSelection 选中派生状态', () => {
  it('无选中时为空', () => {
    const { api } = makeStore()
    expect(api.selectedIds.value).toEqual([])
    expect(api.hasSelection.value).toBe(false)
    expect(api.hasMulti.value).toBe(false)
  })

  it('多选优先；无多选时回退单选', () => {
    const multi = makeStore({ selectedIds: ['a', 'b'], selectedId: 'a' })
    expect(multi.api.selectedIds.value).toEqual(['a', 'b'])
    expect(multi.api.hasMulti.value).toBe(true)

    const single = makeStore({ selectedId: 'a' })
    expect(single.api.selectedIds.value).toEqual(['a'])
    expect(single.api.hasSelection.value).toBe(true)
    expect(single.api.hasMulti.value).toBe(false)
  })
})

describe('useHeaderSelection 批量复制/删除', () => {
  it('复制选中集合中的每个 id', () => {
    const { api, raw } = makeStore({ selectedIds: ['a', 'b'] })
    api.duplicateSelection()
    expect(raw.duplicateComponent.mock.calls).toEqual([['a'], ['b']])
  })

  it('删除跳过锁定组件，有可删除项时清空选中', () => {
    const { api, raw } = makeStore({ selectedIds: ['a', 'locked', 'b'] })
    api.deleteSelection()
    expect(raw.removeComponent.mock.calls).toEqual([['a'], ['b']])
    expect(raw.clearSelection).toHaveBeenCalledTimes(1)
  })

  it('全部锁定时不删除也不清空选中', () => {
    const { api, raw } = makeStore({ selectedIds: ['locked'] })
    api.deleteSelection()
    expect(raw.removeComponent).not.toHaveBeenCalled()
    expect(raw.clearSelection).not.toHaveBeenCalled()
  })
})

describe('useHeaderSelection 图层顺序', () => {
  it('置顶按 zIndex 升序执行，保持集合内视觉顺序', () => {
    const { api, raw } = makeStore({ selectedIds: ['a', 'b', 'c', 'locked'] })
    api.bringSelectionToFront()
    expect(raw.bringToFront.mock.calls).toEqual([['a'], ['c'], ['b']])
  })

  it('置底按 zIndex 降序执行', () => {
    const { api, raw } = makeStore({ selectedIds: ['a', 'b', 'c', 'locked'] })
    api.sendSelectionToBack()
    expect(raw.sendToBack.mock.calls).toEqual([['b'], ['c'], ['a']])
  })

  it('上移按 zIndex 降序、下移按 zIndex 升序执行', () => {
    const { api, raw } = makeStore({ selectedIds: ['a', 'b', 'c', 'locked'] })
    api.moveSelectionUp()
    expect(raw.moveUp.mock.calls).toEqual([['b'], ['c'], ['a']])
    api.moveSelectionDown()
    expect(raw.moveDown.mock.calls).toEqual([['a'], ['c'], ['b']])
  })

  it('忽略锁定的组件', () => {
    const { api, raw } = makeStore({ selectedIds: ['locked'] })
    api.bringSelectionToFront()
    api.sendSelectionToBack()
    api.moveSelectionUp()
    api.moveSelectionDown()
    expect(raw.bringToFront).not.toHaveBeenCalled()
    expect(raw.sendToBack).not.toHaveBeenCalled()
    expect(raw.moveUp).not.toHaveBeenCalled()
    expect(raw.moveDown).not.toHaveBeenCalled()
  })
})

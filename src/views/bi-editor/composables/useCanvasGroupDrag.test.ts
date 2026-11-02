import { describe, it, expect, vi } from 'vitest'
import { useCanvasGroupDrag } from './useCanvasGroupDrag'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { ComponentInstance } from '@/views/bi-editor/types'

type BiEditorStore = ReturnType<typeof useBiEditorStore>
type GroupDragOptions = Parameters<typeof useCanvasGroupDrag>[0]

function makeComponent(
  id: string,
  x: number,
  y: number,
  overrides: Partial<ComponentInstance> = {},
): ComponentInstance {
  return {
    id,
    type: 'bar-chart',
    name: id,
    x,
    y,
    width: 100,
    height: 100,
    zIndex: 0,
    visible: true,
    locked: false,
    props: {},
    style: {},
    dataSource: { datasetId: null },
    dataConfig: {},
    groupId: 'g1',
    ...overrides,
  }
}

interface HarnessOptions {
  master?: Partial<ComponentInstance>
  snapToGrid?: boolean
  snapRectToGuides?: GroupDragOptions['snapRectToGuides']
}

function makeHarness(options: HarnessOptions = {}) {
  const master = makeComponent('a', 10, 10, options.master)
  const sibling = makeComponent('b', 200, 10)
  const components = [master, sibling]
  const store = {
    components,
    canvas: { snapToGrid: options.snapToGrid ?? false, gridSize: 10 },
    getComponent: vi.fn((id: string) => components.find((c) => c.id === id) ?? null),
    hitTestSelectedGroupBlank: vi.fn(() => null as { masterId: string } | null),
    setDragPreview: vi.fn(),
    moveComponent: vi.fn(),
    commitGroupDrag: vi.fn(),
    pushHistory: vi.fn(),
    abortGroupDrag: vi.fn(),
    selectComponent: vi.fn(),
  }
  const deps = {
    store: store as unknown as BiEditorStore,
    clientToWorld: (clientX: number, clientY: number) => ({ x: clientX, y: clientY }),
    snapRectToGuides: options.snapRectToGuides ?? vi.fn((_id: string, rect: { left: number; top: number }) => ({
      rect: { ...rect, width: 100, height: 100 },
      hitsX: [],
      hitsY: [],
    })),
    applySnapLines: vi.fn(),
    clearSnapLines: vi.fn(),
    resetSnapCache: vi.fn(),
    suppressNextClick: vi.fn(),
  }
  const api = useCanvasGroupDrag(deps)
  return { api, store, deps, master, sibling }
}

function mousedown(clientX: number, clientY: number): MouseEvent {
  return new MouseEvent('mousedown', {
    button: 0,
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  })
}

describe('useCanvasGroupDrag 启动判定', () => {
  it('未命中分组空白区时返回 false', () => {
    const { api, store } = makeHarness()
    const started = api.startGroupDrag(mousedown(10, 10), { x: 10, y: 10 })
    expect(started).toBe(false)
    expect(store.hitTestSelectedGroupBlank).toHaveBeenCalledWith(10, 10)
    expect(document.body.classList.contains('bi-dragging')).toBe(false)
  })

  it('主组件锁定时不启动', () => {
    const { api, store } = makeHarness({ master: { locked: true } })
    store.hitTestSelectedGroupBlank.mockReturnValue({ masterId: 'a' })
    expect(api.startGroupDrag(mousedown(10, 10), { x: 10, y: 10 })).toBe(false)
    expect(document.body.classList.contains('bi-dragging')).toBe(false)
  })

  it('命中后启动拖拽并阻止默认行为', () => {
    const { api, store } = makeHarness()
    store.hitTestSelectedGroupBlank.mockReturnValue({ masterId: 'a' })
    const e = mousedown(10, 10)
    const prevent = vi.spyOn(e, 'preventDefault')
    const stop = vi.spyOn(e, 'stopPropagation')
    expect(api.startGroupDrag(e, { x: 10, y: 10 })).toBe(true)
    expect(prevent).toHaveBeenCalled()
    expect(stop).toHaveBeenCalled()
    expect(document.body.classList.contains('bi-dragging')).toBe(true)
    api.dispose()
  })
})

describe('useCanvasGroupDrag 拖拽提交', () => {
  it('移动超过阈值后只更新预览，mouseup 时一次性提交', () => {
    const { api, store, deps } = makeHarness()
    store.hitTestSelectedGroupBlank.mockReturnValue({ masterId: 'a' })
    api.startGroupDrag(mousedown(10, 10), { x: 10, y: 10 })

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 12, clientY: 12 }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30 }))
    expect(store.setDragPreview).toHaveBeenLastCalledWith('a', 'g1', 40, 20)
    expect(store.moveComponent).not.toHaveBeenCalled()

    window.dispatchEvent(new MouseEvent('mouseup'))
    expect(store.moveComponent).toHaveBeenCalledWith('a', 50, 30)
    expect(store.commitGroupDrag).toHaveBeenCalledWith('a')
    expect(store.pushHistory).toHaveBeenCalledTimes(1)
    expect(deps.suppressNextClick).toHaveBeenCalledTimes(1)
    expect(deps.resetSnapCache).toHaveBeenCalled()
    expect(document.body.classList.contains('bi-dragging')).toBe(false)
  })

  it('小于阈值视为纯点击：取消拖拽并选中主组件，不写历史', () => {
    const { api, store } = makeHarness()
    store.hitTestSelectedGroupBlank.mockReturnValue({ masterId: 'a' })
    api.startGroupDrag(mousedown(10, 10), { x: 10, y: 10 })

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 11, clientY: 11 }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    expect(store.abortGroupDrag).toHaveBeenCalled()
    expect(store.selectComponent).toHaveBeenCalledWith('a')
    expect(store.moveComponent).not.toHaveBeenCalled()
    expect(store.pushHistory).not.toHaveBeenCalled()
  })

  it('开启网格吸附时对预览坐标取整', () => {
    const harness = makeHarness({
      snapToGrid: true,
      snapRectToGuides: vi.fn(() => ({
        rect: { left: 47, top: 23, width: 100, height: 100 },
        hitsX: [47],
        hitsY: [23],
      })),
    })
    harness.store.hitTestSelectedGroupBlank.mockReturnValue({ masterId: 'a' })
    harness.api.startGroupDrag(mousedown(10, 10), { x: 10, y: 10 })

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30 }))
    expect(harness.deps.applySnapLines).toHaveBeenCalledWith([47], [23])
    expect(harness.store.setDragPreview).toHaveBeenLastCalledWith('a', 'g1', 40, 10)

    window.dispatchEvent(new MouseEvent('mouseup'))
    expect(harness.store.moveComponent).toHaveBeenCalledWith('a', 50, 20)
    harness.api.dispose()
  })

  it('未开启吸附时清除参考线', () => {
    const { api, store, deps } = makeHarness()
    store.hitTestSelectedGroupBlank.mockReturnValue({ masterId: 'a' })
    api.startGroupDrag(mousedown(10, 10), { x: 10, y: 10 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30 }))
    expect(deps.clearSnapLines).toHaveBeenCalled()
    window.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('dispose 后移除监听并清理全局状态', () => {
    const { api, store } = makeHarness()
    store.hitTestSelectedGroupBlank.mockReturnValue({ masterId: 'a' })
    api.startGroupDrag(mousedown(10, 10), { x: 10, y: 10 })
    api.dispose()
    expect(document.body.classList.contains('bi-dragging')).toBe(false)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30 }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    expect(store.setDragPreview).not.toHaveBeenCalled()
    expect(store.moveComponent).not.toHaveBeenCalled()
  })
})

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CanvasState, ComponentInstance } from '@/views/bi-editor/types'
import { DEFAULT_ZOOM, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'
import { createCanvasAlign } from './canvas-align'

function makeCanvas(width = 1000, height = 800): CanvasState {
  return {
    width,
    height,
    zoom: DEFAULT_ZOOM,
    backgroundColor: '#fff',
    backgroundImage: '',
    showGrid: true,
    gridSize: 10,
    snapToGrid: true,
    showRuler: true,
    showGuides: true,
    scrollX: DEFAULT_VIEWPORT_OFFSET.x,
    scrollY: DEFAULT_VIEWPORT_OFFSET.y,
  }
}

function makeComponent(id: string, overrides: Partial<ComponentInstance> = {}): ComponentInstance {
  return {
    id,
    type: 'bar-chart',
    name: id,
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    zIndex: 1,
    visible: true,
    locked: false,
    props: {},
    style: {},
    dataSource: { datasetId: null },
    dataConfig: {},
    ...overrides,
  }
}

function createHarness() {
  const canvas = ref(makeCanvas())
  const components = ref<ComponentInstance[]>([])
  const selectedId = ref<string | null>(null)
  const selectedIds = ref<string[]>([])
  const pushHistory = vi.fn()
  const ops = {
    alignHCenter: vi.fn(),
    alignRight: vi.fn(),
    alignVCenter: vi.fn(),
    alignBottom: vi.fn(),
  }
  const align = createCanvasAlign({
    canvas,
    components,
    selectedId,
    selectedIds,
    pushHistory,
    ops,
  })
  return { align, canvas, components, selectedId, selectedIds, pushHistory, ops }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('createCanvasAlign', () => {
  it('单选未锁定组件时按画布尺寸居中 / 靠右 / 垂直居中 / 靠底', () => {
    const h = createHarness()
    h.components.value = [makeComponent('a', { x: 0, y: 0, width: 200, height: 100 })]
    h.selectedId.value = 'a'
    h.selectedIds.value = ['a']

    h.align.alignHCenter()
    expect(h.components.value[0].x).toBe(400)
    h.align.alignRight()
    expect(h.components.value[0].x).toBe(800)
    h.align.alignVCenter()
    expect(h.components.value[0].y).toBe(350)
    h.align.alignBottom()
    expect(h.components.value[0].y).toBe(700)
    expect(h.pushHistory).toHaveBeenCalledTimes(4)
    expect(h.ops.alignHCenter).not.toHaveBeenCalled()
  })

  it('多选时委托给组件操作模块（按包围盒对齐）', () => {
    const h = createHarness()
    h.components.value = [makeComponent('a'), makeComponent('b', { x: 500 })]
    h.selectedId.value = 'a'
    h.selectedIds.value = ['a', 'b']

    h.align.alignHCenter()
    h.align.alignBottom()
    expect(h.ops.alignHCenter).toHaveBeenCalledTimes(1)
    expect(h.ops.alignBottom).toHaveBeenCalledTimes(1)
    expect(h.pushHistory).not.toHaveBeenCalled()
  })

  it('单选但组件被锁定时委托给组件操作模块（不直接修改）', () => {
    const h = createHarness()
    h.components.value = [makeComponent('a', { locked: true })]
    h.selectedId.value = 'a'
    h.selectedIds.value = ['a']

    h.align.alignRight()
    expect(h.components.value[0].x).toBe(100)
    expect(h.ops.alignRight).toHaveBeenCalledTimes(1)
    expect(h.pushHistory).not.toHaveBeenCalled()
  })

  it('没有任何选中时委托给组件操作模块', () => {
    const h = createHarness()
    h.align.alignVCenter()
    expect(h.ops.alignVCenter).toHaveBeenCalledTimes(1)
  })

  it('画布尺寸变化后单选对齐使用最新尺寸', () => {
    const h = createHarness()
    h.components.value = [makeComponent('a', { width: 100 })]
    h.selectedId.value = 'a'
    h.selectedIds.value = ['a']

    h.canvas.value = makeCanvas(500, 400)
    h.align.alignRight()
    expect(h.components.value[0].x).toBe(400)
  })
})

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { createClipboard } from './clipboard'

function makeComponent(id: string, overrides: Partial<ComponentInstance> = {}): ComponentInstance {
  return {
    id,
    type: 'bar-chart',
    name: id,
    x: 0,
    y: 0,
    width: 100,
    height: 60,
    zIndex: 1,
    visible: true,
    locked: false,
    props: { title: id },
    style: {},
    dataSource: { datasetId: null },
    dataConfig: {},
    ...overrides,
  }
}

function createHarness() {
  const components = ref<ComponentInstance[]>([])
  const selectedId = ref<string | null>(null)
  const selectedIds = ref<string[]>([])
  const pushHistory = vi.fn()
  const clipboard = createClipboard({ components, selectedId, selectedIds, pushHistory })
  return { clipboard, components, selectedId, selectedIds, pushHistory }
}

/** 让 navigator.clipboard 不可用，回到模块内剪贴板路径 */
function withoutSystemClipboard() {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
}

beforeEach(() => {
  withoutSystemClipboard()
})

describe('createClipboard', () => {
  it('没有选中组件时复制返回 false', async () => {
    const h = createHarness()
    expect(await h.clipboard.copyToClipboard()).toBe(false)
  })

  it('复制多选组件后粘贴生成新 id / 偏移位置 / 叠高层级，并写入历史', async () => {
    const h = createHarness()
    h.components.value = [makeComponent('a', { x: 10, y: 10 }), makeComponent('b', { zIndex: 5 })]
    h.selectedIds.value = ['a', 'b']

    expect(await h.clipboard.copyToClipboard()).toBe(true)
    await h.clipboard.pasteFromClipboard()

    expect(h.components.value).toHaveLength(4)
    const [copiedA, copiedB] = h.components.value.slice(2)
    expect(copiedA.id).not.toBe('a')
    expect(copiedA.name).toBe('a (副本)')
    expect(copiedA.x).toBe(30)
    expect(copiedA.y).toBe(30)
    expect(copiedA.zIndex).toBe(6)
    expect(copiedB.x).toBe(30)
    expect(copiedB.y).toBe(30)
    expect(copiedB.zIndex).toBe(7)
    // 粘贴后 Props 为浅拷贝，不共享引用
    expect(copiedA.props).not.toBe(h.components.value[0].props)
    expect(h.selectedId.value).toBe(copiedB.id)
    expect(h.pushHistory).toHaveBeenCalledTimes(1)
  })

  it('无选中但 selectedId 存在时复制单选组件', async () => {
    const h = createHarness()
    h.components.value = [makeComponent('a')]
    h.selectedId.value = 'a'
    expect(await h.clipboard.copyToClipboard()).toBe(true)
    await h.clipboard.pasteFromClipboard()
    expect(h.components.value).toHaveLength(2)
    expect(h.pushHistory).toHaveBeenCalledTimes(1)
  })

  it('模块内剪贴板为空时读取系统剪贴板 text/plain JSON', async () => {
    const h = createHarness()
    const source = makeComponent('sys', { x: 5, y: 5 })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        read: vi.fn(async () => [
          {
            types: ['text/plain'],
            getType: vi.fn(async () => new Blob([JSON.stringify([source])], { type: 'text/plain' })),
          },
        ]),
      },
    })

    await h.clipboard.pasteFromClipboard()
    expect(h.components.value).toHaveLength(1)
    expect(h.components.value[0].id).not.toBe('sys')
    expect(h.pushHistory).toHaveBeenCalledTimes(1)
  })

  it('系统剪贴板内容不是组件 JSON 且模块内为空时什么都不做', async () => {
    const h = createHarness()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        read: vi.fn(async () => [
          {
            types: ['text/plain'],
            getType: vi.fn(async () => new Blob(['hello'], { type: 'text/plain' })),
          },
        ]),
      },
    })

    await h.clipboard.pasteFromClipboard()
    expect(h.components.value).toHaveLength(0)
    expect(h.pushHistory).not.toHaveBeenCalled()
  })

  it('读取系统剪贴板抛错时回退模块内剪贴板', async () => {
    const h = createHarness()
    h.components.value = [makeComponent('a')]
    h.selectedId.value = 'a'
    await h.clipboard.copyToClipboard()

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        read: vi.fn(async () => {
          throw new Error('permission denied')
        }),
      },
    })

    await h.clipboard.pasteFromClipboard()
    expect(h.components.value).toHaveLength(2)
  })
})

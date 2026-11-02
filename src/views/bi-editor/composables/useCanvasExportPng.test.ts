import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { useBiEditorStore } from '@/stores/bi-editor'
import { useCanvasExportPng } from './useCanvasExportPng'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

const { toPngMock } = vi.hoisted(() => ({
  toPngMock: vi.fn<(node: HTMLElement, options?: Record<string, unknown>) => Promise<string>>(
    async () => 'data:image/png;base64,AAA',
  ),
}))

vi.mock('html-to-image', () => ({ toPng: toPngMock }))

interface HarnessOptions {
  readonly?: boolean
  selectedIds?: string[]
  selectedId?: string | null
  sheet?: HTMLElement | null
}

function mountHarness(options: HarnessOptions = {}) {
  const unregister = vi.fn()
  const hide = vi.fn()
  let exportCallback: (() => Promise<string | null>) | null = null
  const store = {
    canvas: { backgroundColor: '#ffffff' },
    selectedIds: options.selectedIds ?? [],
    selectedId: options.selectedId ?? null,
    registerExportPng: vi.fn((cb: () => Promise<string | null>) => {
      exportCallback = cb
      return unregister
    }),
    clearSelection: vi.fn(),
    selectComponentAccum: vi.fn(),
    selectComponent: vi.fn(),
  }
  const sheet = options.sheet === undefined ? document.createElement('div') : options.sheet
  const canvasSheetRef = ref<HTMLElement | null>(sheet)
  const contextMenuRef = ref<{ hide: () => void } | null>({ hide })

  const Harness = defineComponent({
    setup() {
      useCanvasExportPng({
        store: store as unknown as BiEditorStore,
        readonly: options.readonly ?? false,
        canvasSheetRef,
        contextMenuRef,
      })
      return () => h('div')
    },
  })
  const wrapper = mount(Harness)
  return {
    wrapper,
    store,
    unregister,
    hide,
    canvasSheetRef,
    getExportCallback: () => exportCallback,
  }
}

describe('useCanvasExportPng', () => {
  it('非 readonly 模式注册导出回调，卸载时注销', () => {
    const { wrapper, store, unregister } = mountHarness()
    expect(store.registerExportPng).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(unregister).toHaveBeenCalledTimes(1)
  })

  it('readonly 模式不注册回调', () => {
    const { wrapper, store } = mountHarness({ readonly: true })
    expect(store.registerExportPng).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('导出时隐藏选中态与 info-bar，完成后恢复', async () => {
    const infoBar = document.createElement('div')
    infoBar.className = 'canvas-info-bar'
    document.body.appendChild(infoBar)
    const { wrapper, store, hide, getExportCallback } = mountHarness({
      selectedIds: ['a', 'b'],
      selectedId: 'a',
    })
    const callback = getExportCallback()
    expect(callback).not.toBeNull()

    toPngMock.mockImplementationOnce(async () => {
      // toPng 执行期间 info-bar 应处于隐藏状态
      expect(infoBar.style.display).toBe('none')
      return 'data:image/png;base64,AAA'
    })
    const result = await callback!()
    expect(result).toBe('data:image/png;base64,AAA')
    expect(toPngMock).toHaveBeenCalledTimes(1)
    expect(toPngMock.mock.calls[0][0]).toBeInstanceOf(HTMLElement)
    expect(toPngMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      }),
    )
    expect(hide).toHaveBeenCalled()
    expect(store.clearSelection).toHaveBeenCalled()
    expect(store.selectComponentAccum).toHaveBeenCalledWith('a', false)
    expect(store.selectComponentAccum).toHaveBeenCalledWith('b', false)
    // 导出完成后恢复 info-bar
    expect(infoBar.style.display).toBe('')

    wrapper.unmount()
    infoBar.remove()
  })

  it('仅有单选时用 selectComponent 恢复', async () => {
    const { wrapper, store, getExportCallback } = mountHarness({ selectedId: 'only' })
    await getExportCallback()!()
    expect(store.selectComponent).toHaveBeenCalledWith('only')
    wrapper.unmount()
  })

  it('sheet 不存在时返回 null 且不调用 toPng', async () => {
    toPngMock.mockClear()
    const { wrapper, getExportCallback } = mountHarness({ sheet: null })
    await expect(getExportCallback()!()).resolves.toBeNull()
    expect(toPngMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

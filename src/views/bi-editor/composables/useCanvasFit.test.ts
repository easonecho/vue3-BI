import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useCanvasFit } from './useCanvasFit'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { GuideLine } from '@/views/bi-editor/types'

type BiEditorStore = ReturnType<typeof useBiEditorStore>
type CanvasFitApi = ReturnType<typeof useCanvasFit>

function makeContainer(width: number, height: number): HTMLElement {
  const el = document.createElement('div')
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      width,
      height,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  })
  return el
}

function makeStore(overrides: Record<string, unknown> = {}) {
  const updateCanvas = vi.fn()
  const removeGuide = vi.fn()
  const store = {
    canvas: {
      width: 1920,
      height: 1080,
      showGuides: true,
      ...overrides,
    },
    guides: [] as GuideLine[],
    updateCanvas,
    removeGuide,
  }
  return { store: store as unknown as BiEditorStore, updateCanvas, removeGuide }
}

interface HarnessOptions {
  container: HTMLElement | null
  store: BiEditorStore
  readonly?: boolean
  touchesComponent?: () => boolean
}

function mountHarness(options: HarnessOptions) {
  const api = {} as CanvasFitApi
  const Harness = defineComponent({
    setup() {
      Object.assign(
        api,
        useCanvasFit({
          store: options.store,
          containerRef: ref(options.container),
          readonly: options.readonly ?? false,
          clientToWorld: (x, y) => ({ x, y }),
          eventTouchesComponent: () => options.touchesComponent?.() ?? false,
        }),
      )
      return () => h('div')
    },
  })
  const wrapper = mount(Harness)
  return { api, wrapper }
}

describe('useCanvasFit fitToScreen', () => {
  it('按容器尺寸缩放并居中画布', () => {
    const { store, updateCanvas } = makeStore()
    const { api, wrapper } = mountHarness({ container: makeContainer(1000, 600), store })
    const done = vi.fn()
    window.addEventListener('bi-editor:fit-to-screen-done', done)
    api.fitToScreen()
    // padX=40, padY=24 → avail 920x552；zoom = min(920/1920, 552/1080) = 23/48
    expect(updateCanvas).toHaveBeenCalledWith({
      zoom: 920 / 1920,
      scrollX: 500 - 960 * (920 / 1920),
      scrollY: 300 - 540 * (920 / 1920),
    })
    expect(done).toHaveBeenCalledTimes(1)
    window.removeEventListener('bi-editor:fit-to-screen-done', done)
    wrapper.unmount()
  })

  it('容器不存在或尺寸过小时不更新画布', () => {
    const { store, updateCanvas } = makeStore()
    const { api, wrapper } = mountHarness({ container: null, store })
    api.fitToScreen()
    expect(updateCanvas).not.toHaveBeenCalled()
    wrapper.unmount()

    // 30x30：pad=8 → 可用区 14px < 20px 阈值，不执行缩放
    const tiny = mountHarness({ container: makeContainer(30, 30), store })
    tiny.api.fitToScreen()
    expect(updateCanvas).not.toHaveBeenCalled()
    tiny.wrapper.unmount()
  })

  it('响应全局 fit-to-screen 事件，卸载后移除监听', () => {
    const { store, updateCanvas } = makeStore()
    const { wrapper } = mountHarness({ container: makeContainer(1000, 600), store })
    window.dispatchEvent(new CustomEvent('bi-editor:fit-to-screen'))
    expect(updateCanvas).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    window.dispatchEvent(new CustomEvent('bi-editor:fit-to-screen'))
    expect(updateCanvas).toHaveBeenCalledTimes(1)
  })
})

describe('useCanvasFit 辅助线', () => {
  it('showGuides=false 或没有辅助线时不命中', () => {
    const { store } = makeStore({ showGuides: false })
    const { api, wrapper } = mountHarness({ container: makeContainer(1000, 600), store })
    expect(api.hitTestGuide(0, 0)).toBeNull()
    wrapper.unmount()

    const hidden = makeStore({ showGuides: true })
    const second = mountHarness({ container: makeContainer(1000, 600), store: hidden.store })
    expect(second.api.hitTestGuide(0, 0)).toBeNull()
    second.wrapper.unmount()
  })

  it('在 8px 世界坐标容差内命中垂直/水平辅助线', () => {
    const { store } = makeStore()
    ;(store.guides as GuideLine[]).push(
      { id: 'v', direction: 'vertical', position: 100 },
      { id: 'h', direction: 'horizontal', position: 200 },
    )
    const { api, wrapper } = mountHarness({ container: makeContainer(1000, 600), store })
    expect(api.hitTestGuide(104, 0)?.id).toBe('v')
    expect(api.hitTestGuide(108, 0)?.id).toBe('v')
    expect(api.hitTestGuide(110, 0)).toBeNull()
    expect(api.hitTestGuide(0, 196)?.id).toBe('h')
    expect(api.hitTestGuide(0, 191)).toBeNull()
    wrapper.unmount()
  })

  it('双击辅助线删除并阻止冒泡；readonly 模式不删除', () => {
    const { store, removeGuide } = makeStore()
    ;(store.guides as GuideLine[]).push({ id: 'v', direction: 'vertical', position: 100 })
    const { api, wrapper } = mountHarness({ container: makeContainer(1000, 600), store })
    const e = new MouseEvent('dblclick', { clientX: 104, clientY: 0 })
    const stop = vi.spyOn(e, 'stopPropagation')
    api.onCanvasDblClick(e)
    expect(removeGuide).toHaveBeenCalledWith('v')
    expect(stop).toHaveBeenCalled()
    wrapper.unmount()

    removeGuide.mockClear()
    const readonly = mountHarness({
      container: makeContainer(1000, 600),
      store,
      readonly: true,
    })
    readonly.api.onCanvasDblClick(new MouseEvent('dblclick', { clientX: 104, clientY: 0 }))
    expect(removeGuide).not.toHaveBeenCalled()
    readonly.wrapper.unmount()
  })
})

describe('useCanvasFit sheet 双击', () => {
  it('双击组件内部时不触发自适应', () => {
    const { store, updateCanvas } = makeStore()
    const { api, wrapper } = mountHarness({
      container: makeContainer(1000, 600),
      store,
      touchesComponent: () => true,
    })
    api.onSheetDblClick(new MouseEvent('dblclick', { clientX: 0, clientY: 0 }))
    expect(updateCanvas).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('双击辅助线附近时不触发自适应', () => {
    const { store, updateCanvas } = makeStore()
    ;(store.guides as GuideLine[]).push({ id: 'v', direction: 'vertical', position: 100 })
    const { api, wrapper } = mountHarness({ container: makeContainer(1000, 600), store })
    api.onSheetDblClick(new MouseEvent('dblclick', { clientX: 104, clientY: 0 }))
    expect(updateCanvas).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('双击空白区域时触发自适应', () => {
    const { store, updateCanvas } = makeStore()
    const { api, wrapper } = mountHarness({ container: makeContainer(1000, 600), store })
    api.onSheetDblClick(new MouseEvent('dblclick', { clientX: 0, clientY: 0 }))
    expect(updateCanvas).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

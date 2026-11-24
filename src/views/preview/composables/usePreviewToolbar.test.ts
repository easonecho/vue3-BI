import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { usePreviewToolbar } from './usePreviewToolbar'

let hidden = false

/** 模拟页面可见性变化并派发事件 */
function setHidden(value: boolean) {
  hidden = value
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hidden,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

function mountToolbar() {
  const onRefresh = vi.fn()
  let api!: ReturnType<typeof usePreviewToolbar>

  const TestComp = defineComponent({
    setup() {
      api = usePreviewToolbar({
        rootRef: ref<HTMLElement | null>(null),
        onRefresh,
      })
      return () => null
    },
  })

  return { wrapper: mount(TestComp), api, onRefresh }
}

describe('usePreviewToolbar 自动刷新', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    hidden = false
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('页面隐藏时跳过刷新，重新可见且超过间隔后补刷', () => {
    const { wrapper, api, onRefresh } = mountToolbar()
    api.autoRefreshInterval.value = 5
    api.resetAutoRefresh()

    setHidden(true)
    vi.advanceTimersByTime(20_000)
    expect(onRefresh).not.toHaveBeenCalled()

    setHidden(false)
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(onRefresh).toHaveBeenCalledWith(true)

    // 恢复后继续按间隔刷新
    vi.advanceTimersByTime(5_000)
    expect(onRefresh).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('短暂隐藏后恢复不补刷，等待下一次间隔', () => {
    const { wrapper, api, onRefresh } = mountToolbar()
    api.autoRefreshInterval.value = 5
    api.resetAutoRefresh()

    setHidden(true)
    vi.advanceTimersByTime(2_000)
    setHidden(false)
    expect(onRefresh).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3_000)
    expect(onRefresh).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('关闭自动刷新后不再触发', () => {
    const { wrapper, api, onRefresh } = mountToolbar()
    api.autoRefreshInterval.value = 0
    api.resetAutoRefresh()

    setHidden(true)
    vi.advanceTimersByTime(10_000)
    setHidden(false)
    vi.advanceTimersByTime(10_000)

    expect(onRefresh).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('组件卸载后清理定时器与可见性监听', () => {
    const { wrapper, api, onRefresh } = mountToolbar()
    api.autoRefreshInterval.value = 5
    api.resetAutoRefresh()

    wrapper.unmount()
    vi.advanceTimersByTime(20_000)
    setHidden(false)

    expect(onRefresh).not.toHaveBeenCalled()
  })
})

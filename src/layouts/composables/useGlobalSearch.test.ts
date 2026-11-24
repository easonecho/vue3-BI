import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGlobalSearch } from './useGlobalSearch'
import type { GlobalSearchItem } from './useGlobalSearch'
import type { RecentDashboard } from '@/utils/recent-dashboards'

const recent: RecentDashboard[] = [
  { id: 1, name: '销售看板', visitedAt: 3000 },
  { id: 2, name: '库存看板', visitedAt: 2000 },
]

function createSearch(
  fetchDashboards: (keyword: string) => Promise<GlobalSearchItem[]> = vi.fn(() =>
    Promise.resolve([]),
  ),
) {
  const fetcher = vi.fn(fetchDashboards)
  const api = useGlobalSearch({
    fetchDashboards: fetcher,
    readRecent: () => recent,
    debounceMs: 250,
    limit: 2,
  })
  return { api, fetcher }
}

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('空关键字展示最近访问', () => {
    const { api } = createSearch()
    api.refreshRecent()

    expect(api.hasQuery.value).toBe(false)
    expect(api.results.value).toEqual([
      { id: 1, name: '销售看板', recent: true },
      { id: 2, name: '库存看板', recent: true },
    ])
  })

  it('输入关键字防抖搜索并限制条数', async () => {
    const { api, fetcher } = createSearch(() =>
      Promise.resolve([
        { id: 11, name: '销售一' },
        { id: 12, name: '销售二' },
        { id: 13, name: '销售三' },
      ]),
    )

    api.setKeyword('销售')
    expect(api.loading.value).toBe(true)

    vi.advanceTimersByTime(249)
    expect(fetcher).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fetcher).toHaveBeenCalledWith('销售')

    await Promise.resolve()
    await Promise.resolve()

    expect(api.loading.value).toBe(false)
    expect(api.results.value).toHaveLength(2)
    expect(api.results.value[0]).toMatchObject({ id: 11, name: '销售一' })
  })

  it('清空关键字立即回退到最近访问并取消搜索', () => {
    const { api, fetcher } = createSearch(() => Promise.resolve([{ id: 11, name: '销售一' }]))

    api.setKeyword('销售')
    api.setKeyword('')

    vi.advanceTimersByTime(300)
    expect(fetcher).not.toHaveBeenCalled()
    expect(api.results.value).toHaveLength(2)
  })

  it('上下键循环切换并返回选中 ID', () => {
    const { api } = createSearch()
    api.refreshRecent()

    expect(api.selectActive()).toBe(1)

    api.moveActive(1)
    expect(api.activeIndex.value).toBe(1)
    expect(api.selectActive()).toBe(2)

    api.moveActive(1)
    expect(api.activeIndex.value).toBe(0)
    expect(api.selectActive()).toBe(1)

    api.moveActive(-1)
    expect(api.activeIndex.value).toBe(1)
  })

  it('无结果时切换与选中保持安全', () => {
    const { api } = createSearch()
    api.setKeyword('不存在')

    api.moveActive(1)
    expect(api.activeIndex.value).toBe(0)
    expect(api.selectActive()).toBeNull()
  })

  it('请求失败时清空结果并结束加载态', async () => {
    const { api } = createSearch(() => Promise.reject(new Error('network error')))

    api.setKeyword('销售')
    vi.advanceTimersByTime(250)
    await Promise.resolve()
    await Promise.resolve()

    expect(api.results.value).toEqual([])
    expect(api.loading.value).toBe(false)
  })

  it('reset 清空关键字与结果并取消防抖', () => {
    const { api, fetcher } = createSearch()

    api.setKeyword('销售')
    api.reset()
    vi.advanceTimersByTime(300)

    expect(fetcher).not.toHaveBeenCalled()
    expect(api.keyword.value).toBe('')
    expect(api.results.value).toEqual([])
    expect(api.loading.value).toBe(false)
  })
})

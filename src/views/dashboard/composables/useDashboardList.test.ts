import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DashboardListQuery } from '@/api/dashboard'
import type { Dashboard, DashboardGroup } from '@/api/types'
import { useDashboardList } from './useDashboardList'

const { listMock, groupsMock, favoriteMock, messageMock } = vi.hoisted(() => ({
  listMock:
    vi.fn<
      (params: DashboardListQuery) => Promise<{ data: { list: Dashboard[]; total: number } }>
    >(),
  groupsMock: vi.fn<() => Promise<{ data: DashboardGroup[] }>>(),
  favoriteMock: vi.fn<(id: number) => Promise<{ data: { isFavorited: boolean } }>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/dashboard', () => ({
  getDashboardList: listMock,
  toggleFavorite: favoriteMock,
}))

vi.mock('@/api/dashboard-group', () => ({
  getDashboardGroupList: groupsMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: vi.fn() },
}))

function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    id: 1,
    name: '销售看板',
    description: '季度销售',
    status: 1,
    isPublic: true,
    favorites: null,
    ...overrides,
  }
}

function makeGroup(overrides: Partial<DashboardGroup> = {}): DashboardGroup {
  return {
    id: 1,
    name: '默认分组',
    sort: 0,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

/** 让 fire-and-forget 的加载任务完成 */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: { list: [makeDashboard()], total: 1 } })
  groupsMock.mockResolvedValue({ data: [] })
  favoriteMock.mockResolvedValue({ data: { isFavorited: true } })
})

describe('useDashboardList 查询参数', () => {
  it('loadList 携带分页、关键字、状态、公开性、收藏与分组筛选', async () => {
    const api = useDashboardList()
    api.filters.keyword = '销售'
    api.filters.status = 1
    api.filters.isPublic = false
    api.filters.onlyFavorites = true
    api.groupFilter.value = 3
    api.page.value = 2
    api.pageSize.value = 24

    await api.loadList()

    expect(listMock).toHaveBeenCalledWith({
      page: 2,
      pageSize: 24,
      keyword: '销售',
      status: 1,
      isPublic: false,
      onlyFavorites: true,
      groupId: 3,
    })
    expect(api.list.value).toHaveLength(1)
    expect(api.total.value).toBe(1)
    expect(api.loading.value).toBe(false)
  })

  it('未分组筛选传 ungrouped，清空分组后两者都不传', async () => {
    const api = useDashboardList()

    api.groupFilter.value = 'ungrouped'
    await api.loadList()
    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ ungrouped: true }),
    )
    expect(listMock.mock.lastCall?.[0]).not.toHaveProperty('groupId')

    api.groupFilter.value = undefined
    await api.loadList()
    expect(listMock.mock.lastCall?.[0]).not.toHaveProperty('ungrouped')
    expect(listMock.mock.lastCall?.[0]).not.toHaveProperty('groupId')
  })

  it('空关键字与未收藏状态转 undefined', async () => {
    const api = useDashboardList()
    await api.loadList()

    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: undefined, onlyFavorites: undefined }),
    )
  })
})

describe('useDashboardList 统计与筛选动作', () => {
  it('按 status 汇总已发布与草稿数量', async () => {
    listMock.mockResolvedValue({
      data: {
        list: [
          makeDashboard({ id: 1, status: 1 }),
          makeDashboard({ id: 2, status: 1 }),
          makeDashboard({ id: 3, status: 0 }),
        ],
        total: 3,
      },
    })
    const api = useDashboardList()
    await api.loadList()

    expect(api.publishedCount.value).toBe(2)
    expect(api.draftCount.value).toBe(1)
  })

  it('handleSearch 回到第一页并重新加载', async () => {
    const api = useDashboardList()
    api.page.value = 3
    api.handleSearch()
    await flush()

    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
  })

  it('handleReset 清空全部筛选并回到第一页', async () => {
    const api = useDashboardList()
    api.filters.keyword = '销售'
    api.filters.status = 0
    api.filters.isPublic = false
    api.filters.onlyFavorites = true
    api.groupFilter.value = 2
    api.page.value = 4

    api.handleReset()
    await flush()

    expect(api.filters.keyword).toBe('')
    expect(api.filters.status).toBeUndefined()
    expect(api.filters.isPublic).toBeUndefined()
    expect(api.filters.onlyFavorites).toBe(false)
    expect(api.groupFilter.value).toBeUndefined()
    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, keyword: undefined, status: undefined }),
    )
  })

  it('toggleFavoritesFilter 切换收藏筛选并回到第一页', async () => {
    const api = useDashboardList()
    api.page.value = 2

    api.toggleFavoritesFilter()
    await flush()

    expect(api.filters.onlyFavorites).toBe(true)
    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ onlyFavorites: true }))
  })

  it('加载失败时吞掉异常并复位 loading，保留已有列表', async () => {
    const api = useDashboardList()
    await api.loadList()

    listMock.mockRejectedValueOnce(new Error('boom'))
    await expect(api.loadList()).resolves.toBeUndefined()
    expect(api.loading.value).toBe(false)
    expect(api.list.value).toHaveLength(1)
  })
})

describe('useDashboardList 收藏', () => {
  it('收藏成功写入 favorites，取消收藏清空 favorites', async () => {
    const api = useDashboardList()
    const item = makeDashboard({ id: 7, favorites: null })

    favoriteMock.mockResolvedValueOnce({ data: { isFavorited: true } })
    await api.handleToggleFavorite(item)
    expect(item.favorites).toEqual([{ id: -1 }])

    favoriteMock.mockResolvedValueOnce({ data: { isFavorited: false } })
    await api.handleToggleFavorite(item)
    expect(item.favorites).toEqual([])
  })

  it('仅看收藏时取消收藏会从列表移除并递减总数', async () => {
    listMock.mockResolvedValue({ data: { list: [makeDashboard({ id: 7 })], total: 5 } })
    const api = useDashboardList()
    await api.loadList()
    api.filters.onlyFavorites = true
    const item = api.list.value[0]

    favoriteMock.mockResolvedValueOnce({ data: { isFavorited: false } })
    await api.handleToggleFavorite(item)

    expect(api.list.value).toHaveLength(0)
    expect(api.total.value).toBe(4)
  })

  it('收藏接口失败时不修改本地状态', async () => {
    favoriteMock.mockRejectedValueOnce(new Error('boom'))
    const api = useDashboardList()
    const item = makeDashboard({ id: 8, favorites: null })

    await expect(api.handleToggleFavorite(item)).resolves.toBeUndefined()
    expect(item.favorites).toBeNull()
  })
})

describe('useDashboardList 删除回退与分组', () => {
  it('删除当前页最后一条时回退一页再刷新', async () => {
    listMock.mockResolvedValue({ data: { list: [makeDashboard()], total: 1 } })
    const api = useDashboardList()
    await api.loadList()
    api.page.value = 3

    await api.handleDeleted()

    expect(api.page.value).toBe(2)
    expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('删除后仍有数据时不回退页码', async () => {
    listMock.mockResolvedValue({
      data: { list: [makeDashboard({ id: 1 }), makeDashboard({ id: 2 })], total: 2 },
    })
    const api = useDashboardList()
    await api.loadList()
    api.page.value = 2

    await api.handleDeleted()

    expect(api.page.value).toBe(2)
  })

  it('loadGroups 成功写入分组，失败保持空列表并复位 loading', async () => {
    groupsMock.mockResolvedValue({ data: [makeGroup()] })
    const api = useDashboardList()
    await api.loadGroups()

    expect(api.groups.value).toHaveLength(1)
    expect(api.groupsLoading.value).toBe(false)

    groupsMock.mockRejectedValueOnce(new Error('boom'))
    await expect(api.loadGroups()).resolves.toBeUndefined()
    expect(api.groups.value).toHaveLength(1)
    expect(api.groupsLoading.value).toBe(false)
  })

  it('init 同时加载看板列表与分组', async () => {
    const api = useDashboardList()
    api.init()
    await flush()

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(groupsMock).toHaveBeenCalledTimes(1)
    expect(api.loading.value).toBe(false)
    expect(api.groupsLoading.value).toBe(false)
  })
})

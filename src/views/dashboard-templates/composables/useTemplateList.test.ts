import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTemplateList } from './useTemplateList'
import type {
  DashboardTemplate,
  DashboardTemplateListQuery,
  TemplateCategoryOption,
} from '@/api/dashboard-template'

const { listMock, categoriesMock } = vi.hoisted(() => ({
  listMock: vi.fn<(query?: DashboardTemplateListQuery) => Promise<{ data: DashboardTemplate[] }>>(),
  categoriesMock: vi.fn<() => Promise<{ data: TemplateCategoryOption[] }>>(),
}))

vi.mock('@/api/dashboard-template', () => ({
  getDashboardTemplateList: listMock,
  getTemplateCategories: categoriesMock,
}))

function makeTemplate(overrides: Partial<DashboardTemplate> = {}): DashboardTemplate {
  return {
    id: 1,
    name: '模板 A',
    description: '描述 A',
    category: 'sales',
    isPublic: true,
    isSystem: false,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

/** 让 handleTabChange 触发的 fire-and-forget loadList 完成 */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTemplateList 统计', () => {
  it('按 isSystem 汇总总数/预置/用户模板数量', async () => {
    listMock.mockResolvedValue({
      data: [
        makeTemplate({ id: 1, isSystem: true }),
        makeTemplate({ id: 2, isSystem: true }),
        makeTemplate({ id: 3, isSystem: false }),
      ],
    })
    const api = useTemplateList()
    await api.loadList()

    expect(api.total.value).toBe(3)
    expect(api.presetCount.value).toBe(2)
    expect(api.userCount.value).toBe(1)
  })

  it('加载失败时吞掉异常并复位 loading，保留已有列表', async () => {
    const api = useTemplateList()
    listMock.mockResolvedValueOnce({ data: [makeTemplate()] })
    await api.loadList()

    listMock.mockRejectedValueOnce(new Error('boom'))
    await expect(api.loadList()).resolves.toBeUndefined()
    expect(api.loading.value).toBe(false)
    expect(api.total.value).toBe(1)
  })
})

describe('useTemplateList 查询参数', () => {
  it('preset Tab 携带 isSystem=true，user Tab 携带 isSystem=false，all Tab 不携带', async () => {
    const api = useTemplateList()
    listMock.mockResolvedValue({ data: [] })

    api.activeTab.value = 'preset'
    await api.loadList()
    expect(listMock).toHaveBeenLastCalledWith({ isSystem: true })

    api.activeTab.value = 'user'
    await api.loadList()
    expect(listMock).toHaveBeenLastCalledWith({ isSystem: false })

    api.activeTab.value = 'all'
    await api.loadList()
    expect(listMock).toHaveBeenLastCalledWith({})
  })

  it('切换 Tab 清空分类/公开性筛选并重新拉取', async () => {
    const api = useTemplateList()
    listMock.mockResolvedValue({ data: [] })
    api.filters.category = 'sales'
    api.filters.isPublic = true

    api.activeTab.value = 'preset'
    api.handleTabChange()
    await flush()

    expect(api.filters.category).toBeUndefined()
    expect(api.filters.isPublic).toBeUndefined()
    expect(listMock).toHaveBeenLastCalledWith({ isSystem: true })
    expect(api.loading.value).toBe(false)
  })
})

describe('useTemplateList 客户端过滤', () => {
  beforeEach(() => {
    listMock.mockResolvedValue({
      data: [
        makeTemplate({ id: 1, name: 'Sales Report', description: '季度销售', category: 'sales', isPublic: true }),
        makeTemplate({ id: 2, name: '库存看板', description: '仓库库存', category: 'inventory', isPublic: false }),
        makeTemplate({ id: 3, name: '员工概览', description: 'Sales Team', category: 'hr', isPublic: true }),
      ],
    })
  })

  it('关键字同时匹配名称与描述且忽略大小写', async () => {
    const api = useTemplateList()
    await api.loadList()

    api.filters.keyword = 'sales'
    expect(api.filteredList.value.map((x) => x.id)).toEqual([1, 3])

    api.filters.keyword = '库存'
    expect(api.filteredList.value.map((x) => x.id)).toEqual([2])
  })

  it('按分类与公开性组合过滤', async () => {
    const api = useTemplateList()
    await api.loadList()

    api.filters.category = 'sales'
    expect(api.filteredList.value.map((x) => x.id)).toEqual([1])

    api.filters.isPublic = false
    expect(api.filteredList.value).toHaveLength(0)

    api.filters.category = undefined
    expect(api.filteredList.value.map((x) => x.id)).toEqual([2])
  })

  it('resetFilters 恢复默认值', async () => {
    const api = useTemplateList()
    api.filters.keyword = 'x'
    api.filters.category = 'sales'
    api.filters.isPublic = false
    api.filters.sort = 'name'

    api.resetFilters()

    expect(api.filters.keyword).toBe('')
    expect(api.filters.category).toBeUndefined()
    expect(api.filters.isPublic).toBeUndefined()
    expect(api.filters.sort).toBe('updated')
  })
})

describe('useTemplateList 排序', () => {
  it('默认按 updatedAt 倒序', async () => {
    listMock.mockResolvedValue({
      data: [
        makeTemplate({ id: 1, updatedAt: '2024-01-01T00:00:00.000Z' }),
        makeTemplate({ id: 2, updatedAt: '2024-03-01T00:00:00.000Z' }),
        makeTemplate({ id: 3, updatedAt: '2024-02-01T00:00:00.000Z' }),
      ],
    })
    const api = useTemplateList()
    await api.loadList()

    expect(api.sortedList.value.map((x) => x.id)).toEqual([2, 3, 1])
  })

  it('按 createdAt 倒序', async () => {
    listMock.mockResolvedValue({
      data: [
        makeTemplate({ id: 1, createdAt: '2024-02-01T00:00:00.000Z' }),
        makeTemplate({ id: 2, createdAt: '2024-01-01T00:00:00.000Z' }),
        makeTemplate({ id: 3, createdAt: '2024-03-01T00:00:00.000Z' }),
      ],
    })
    const api = useTemplateList()
    await api.loadList()

    api.filters.sort = 'created'
    expect(api.sortedList.value.map((x) => x.id)).toEqual([3, 1, 2])
  })

  it('按名称排序（localeCompare）', async () => {
    listMock.mockResolvedValue({
      data: [
        makeTemplate({ id: 1, name: 'B 模板' }),
        makeTemplate({ id: 2, name: 'A 模板' }),
        makeTemplate({ id: 3, name: 'C 模板' }),
      ],
    })
    const api = useTemplateList()
    await api.loadList()

    api.filters.sort = 'name'
    expect(api.sortedList.value.map((x) => x.name)).toEqual(['A 模板', 'B 模板', 'C 模板'])
  })

  it('缺失或非法时间字段按 0 处理，不抛异常', async () => {
    listMock.mockResolvedValue({
      data: [
        makeTemplate({ id: 1, updatedAt: '' }),
        makeTemplate({ id: 2, updatedAt: 'not-a-date' }),
        makeTemplate({ id: 3, updatedAt: '2024-05-01T00:00:00.000Z' }),
      ],
    })
    const api = useTemplateList()
    await api.loadList()

    expect(api.sortedList.value.map((x) => x.id)).toEqual([3, 1, 2])
  })
})

describe('useTemplateList 分类枚举', () => {
  it('加载成功后写入分类选项', async () => {
    categoriesMock.mockResolvedValue({
      data: [{ value: 'sales', label: '销售', i18nKey: 'templateManage.category.sales' }],
    })
    const api = useTemplateList()
    await api.loadCategories()

    expect(api.categories.value).toHaveLength(1)
    expect(api.categories.value[0].value).toBe('sales')
  })

  it('加载失败时静默保持空列表', async () => {
    categoriesMock.mockRejectedValueOnce(new Error('boom'))
    const api = useTemplateList()
    await expect(api.loadCategories()).resolves.toBeUndefined()
    expect(api.categories.value).toEqual([])
  })
})

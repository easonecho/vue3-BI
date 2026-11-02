import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Router } from 'vue-router'
import type {
  DashboardTemplate,
  DashboardTemplateListQuery,
  TemplateCategoryOption,
} from '@/api/dashboard-template'
import { useTemplatePage } from './useTemplatePage'

const { listMock, categoriesMock } = vi.hoisted(() => ({
  listMock: vi.fn<(query?: DashboardTemplateListQuery) => Promise<{ data: DashboardTemplate[] }>>(),
  categoriesMock: vi.fn<() => Promise<{ data: TemplateCategoryOption[] }>>(),
}))

vi.mock('@/api/dashboard-template', () => ({
  getDashboardTemplateList: listMock,
  getTemplateCategories: categoriesMock,
  createDashboardTemplate: vi.fn(),
  updateDashboardTemplate: vi.fn(),
  deleteDashboardTemplate: vi.fn(),
  applyTemplate: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
  ElMessageBox: { confirm: vi.fn() },
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

/** 让 init 内 fire-and-forget 的加载任务完成 */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function setup() {
  const router = { push: vi.fn(), replace: vi.fn() } as unknown as Router
  const t = vi.fn((key: string) => {
    if (key === 'templateManage.category.sales') return '销售'
    return key
  })
  const api = useTemplatePage({ router, t })
  return { api, router }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTemplatePage 初始化', () => {
  it('init 并行加载模板列表与分类枚举，并回填统计', async () => {
    listMock.mockResolvedValue({
      data: [
        makeTemplate({ id: 1, isSystem: true }),
        makeTemplate({ id: 2, isSystem: false }),
      ],
    })
    categoriesMock.mockResolvedValue({
      data: [{ value: 'sales', label: '销售', i18nKey: 'templateManage.category.sales' }],
    })
    const { api } = setup()

    api.init()
    await flush()

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(categoriesMock).toHaveBeenCalledTimes(1)
    expect(api.total.value).toBe(2)
    expect(api.presetCount.value).toBe(1)
    expect(api.userCount.value).toBe(1)
    expect(api.categories.value).toHaveLength(1)
    expect(api.loading.value).toBe(false)
  })
})

describe('useTemplatePage 分类文案', () => {
  it('命中分类时返回 i18n 文案，未知值回退原始值，空值返回空串', async () => {
    categoriesMock.mockResolvedValue({
      data: [{ value: 'sales', label: '销售', i18nKey: 'templateManage.category.sales' }],
    })
    const { api } = setup()
    await api.loadCategories()

    expect(api.categoryLabel('sales')).toBe('销售')
    expect(api.categoryLabel('unknown')).toBe('unknown')
    expect(api.categoryLabel(undefined)).toBe('')
    expect(api.categoryLabel(null)).toBe('')
  })
})

describe('useTemplatePage 预览跳转', () => {
  it('navigatePreview 跳转模板预览路由', () => {
    const { api, router } = setup()
    api.navigatePreview(makeTemplate({ id: 5 }))
    expect(router.push).toHaveBeenCalledWith('/preview-template/5')
  })
})

describe('useTemplatePage 操作装配', () => {
  it('apply 命令打开应用对话框，create/edit 跳转编辑器', () => {
    const { api, router } = setup()
    const item = makeTemplate({ id: 9 })

    api.handleCommand('apply', item)
    expect(api.applyTarget.value).toStrictEqual(item)
    expect(api.applyVisible.value).toBe(true)

    api.openCreate()
    expect(router.push).toHaveBeenCalledWith('/bi-editor-template')

    api.openEdit(item)
    expect(router.push).toHaveBeenCalledWith('/bi-editor-template/9')
  })

  it('handleSearch 为响应式过滤触发点，不触发额外请求', () => {
    const { api } = setup()
    expect(() => api.handleSearch()).not.toThrow()
    expect(listMock).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Router } from 'vue-router'
import type { DashboardTemplate } from '@/api/dashboard-template'
import { useTemplateApply } from './useTemplateApply'

const { applyMock, messageMock } = vi.hoisted(() => ({
  applyMock: vi.fn<(id: number, data: unknown) => Promise<{ data: { id: number } }>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('@/api/dashboard-template', () => ({
  applyTemplate: applyMock,
}))

function makeTemplate(overrides: Partial<DashboardTemplate> = {}): DashboardTemplate {
  return {
    id: 8,
    name: '销售模板',
    description: '季度销售报表',
    isPublic: true,
    isSystem: false,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

function setup() {
  const router = { push: vi.fn(), replace: vi.fn() } as unknown as Router
  const api = useTemplateApply({ router, t: (key) => key })
  return { api, router }
}

beforeEach(() => {
  vi.clearAllMocks()
  applyMock.mockResolvedValue({ data: { id: 42 } })
})

describe('useTemplateApply 打开对话框', () => {
  it('记录目标模板并显示对话框', () => {
    const { api } = setup()
    const item = makeTemplate()

    expect(api.applyVisible.value).toBe(false)
    api.openApply(item)

    expect(api.applyTarget.value).toStrictEqual(item)
    expect(api.applyVisible.value).toBe(true)
  })

  it('未设置目标模板时提交直接返回，不调用接口', async () => {
    const { api } = setup()
    await api.confirmApply({ name: '看板', description: '', isPublic: false })
    expect(applyMock).not.toHaveBeenCalled()
  })
})

describe('useTemplateApply 提交校验', () => {
  it('名称为空白时警告且不调用接口', async () => {
    const { api } = setup()
    api.openApply(makeTemplate())

    await api.confirmApply({ name: '   ', description: '描述', isPublic: true })

    expect(messageMock.warning).toHaveBeenCalledWith('dashboard.nameRequired')
    expect(applyMock).not.toHaveBeenCalled()
    expect(api.applying.value).toBe(false)
    expect(api.applyVisible.value).toBe(true)
  })
})

describe('useTemplateApply 提交成功', () => {
  it('去除名称/描述空格后创建看板、关闭对话框并跳转编辑器', async () => {
    const { api, router } = setup()
    api.openApply(makeTemplate({ id: 11 }))

    await api.confirmApply({
      name: '  我的看板  ',
      description: '  来自模板  ',
      isPublic: true,
    })

    expect(applyMock).toHaveBeenCalledWith(11, {
      name: '我的看板',
      description: '来自模板',
      isPublic: true,
    })
    expect(messageMock.success).toHaveBeenCalledWith('dashboard.applySuccess')
    expect(api.applyVisible.value).toBe(false)
    expect(api.applying.value).toBe(false)
    expect(router.push).toHaveBeenCalledWith('/bi-editor/42')
  })

  it('描述为纯空白时提交 undefined', async () => {
    const { api } = setup()
    api.openApply(makeTemplate())

    await api.confirmApply({ name: '看板', description: '   ', isPublic: false })

    expect(applyMock).toHaveBeenCalledWith(8, {
      name: '看板',
      description: undefined,
      isPublic: false,
    })
  })
})

describe('useTemplateApply 提交失败', () => {
  it('接口失败时保持对话框打开并复位 applying', async () => {
    applyMock.mockRejectedValueOnce(new Error('boom'))
    const { api, router } = setup()
    api.openApply(makeTemplate())

    await expect(api.confirmApply({ name: '看板', description: '', isPublic: false }))
      .resolves.toBeUndefined()

    expect(api.applying.value).toBe(false)
    expect(api.applyVisible.value).toBe(true)
    expect(messageMock.success).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('请求进行中 applying 为 true', async () => {
    let resolveApply: (value: { data: { id: number } }) => void = () => {}
    applyMock.mockImplementationOnce(
      () => new Promise((resolve) => { resolveApply = resolve }),
    )
    const { api } = setup()
    api.openApply(makeTemplate())

    const pending = api.confirmApply({ name: '看板', description: '', isPublic: false })
    await Promise.resolve()
    expect(api.applying.value).toBe(true)

    resolveApply({ data: { id: 1 } })
    await pending
    expect(api.applying.value).toBe(false)
  })
})

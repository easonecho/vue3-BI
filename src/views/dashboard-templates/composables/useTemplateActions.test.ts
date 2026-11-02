import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Router } from 'vue-router'
import type { DashboardTemplate } from '@/api/dashboard-template'
import { useTemplateActions } from './useTemplateActions'

const { createMock, updateMock, deleteMock, messageMock, confirmMock } = vi.hoisted(() => ({
  createMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  updateMock: vi.fn<(id: number, data: unknown) => Promise<unknown>>(),
  deleteMock: vi.fn<(id: number) => Promise<unknown>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
  confirmMock: vi.fn<(message: unknown, title?: unknown, options?: unknown) => Promise<unknown>>(),
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: confirmMock },
}))

vi.mock('@/api/dashboard-template', () => ({
  createDashboardTemplate: createMock,
  updateDashboardTemplate: updateMock,
  deleteDashboardTemplate: deleteMock,
}))

function makeTemplate(overrides: Partial<DashboardTemplate> = {}): DashboardTemplate {
  return {
    id: 7,
    name: '销售模板',
    description: '季度销售报表',
    category: 'sales',
    thumbnail: 'data:image/png;base64,xxx',
    layout: { version: '1.0' },
    isPublic: false,
    isSystem: false,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function setup() {
  const router = { push: vi.fn(), replace: vi.fn() } as unknown as Router
  const reload = vi.fn(async () => {})
  const openApply = vi.fn()
  const api = useTemplateActions({ router, t: (key) => key, reload, openApply })
  return { api, router, reload, openApply }
}

beforeEach(() => {
  vi.clearAllMocks()
  confirmMock.mockResolvedValue('confirm')
  createMock.mockResolvedValue({})
  updateMock.mockResolvedValue({})
  deleteMock.mockResolvedValue(null)
})

describe('useTemplateActions 跳转', () => {
  it('新建模板跳转可视化编辑器', () => {
    const { api, router } = setup()
    api.openCreate()
    expect(router.push).toHaveBeenCalledWith('/bi-editor-template')
  })

  it('编辑模板跳转带 id 的编辑器路由', () => {
    const { api, router } = setup()
    api.openEdit(makeTemplate({ id: 12 }))
    expect(router.push).toHaveBeenCalledWith('/bi-editor-template/12')
  })
})

describe('useTemplateActions 复制模板', () => {
  it('以 _copy 命名、强制私有并保留布局/缩略图', async () => {
    const { api, reload } = setup()
    const item = makeTemplate()
    await api.copyTemplate(item)

    expect(createMock).toHaveBeenCalledWith({
      name: '销售模板_copy',
      description: '季度销售报表',
      category: 'sales',
      thumbnail: 'data:image/png;base64,xxx',
      isPublic: false,
      layout: { version: '1.0' },
    })
    expect(messageMock.success).toHaveBeenCalledWith('templateManage.copySuccess')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('空描述/分类/缩略图/布局转为 undefined', async () => {
    const { api } = setup()
    await api.copyTemplate(makeTemplate({
      description: '',
      category: null,
      thumbnail: null,
      layout: null,
    }))

    expect(createMock).toHaveBeenCalledWith({
      name: '销售模板_copy',
      description: undefined,
      category: undefined,
      thumbnail: undefined,
      isPublic: false,
      layout: undefined,
    })
  })

  it('接口失败时提示由拦截器处理，不刷新列表', async () => {
    createMock.mockRejectedValueOnce(new Error('boom'))
    const { api, reload } = setup()
    await expect(api.copyTemplate(makeTemplate())).resolves.toBeUndefined()
    expect(messageMock.success).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('useTemplateActions 公开状态切换', () => {
  it('私有模板切换为公开并提示 setPublicDone', async () => {
    const { api, reload } = setup()
    await api.togglePublic(makeTemplate({ isPublic: false }))

    expect(updateMock).toHaveBeenCalledWith(7, { isPublic: true })
    expect(messageMock.success).toHaveBeenCalledWith('dashboard.setPublicDone')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('公开模板切换为私有并提示 setPrivateDone', async () => {
    const { api, reload } = setup()
    await api.togglePublic(makeTemplate({ isPublic: true }))

    expect(updateMock).toHaveBeenCalledWith(7, { isPublic: false })
    expect(messageMock.success).toHaveBeenCalledWith('dashboard.setPrivateDone')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('接口失败时保留原状态且不刷新', async () => {
    updateMock.mockRejectedValueOnce(new Error('boom'))
    const { api, reload } = setup()
    await api.togglePublic(makeTemplate())
    expect(messageMock.success).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('useTemplateActions 删除模板', () => {
  it('确认后删除并刷新列表', async () => {
    const { api, reload } = setup()
    await api.deleteTemplate(makeTemplate({ id: 9, name: '旧模板' }))

    expect(confirmMock).toHaveBeenCalledTimes(1)
    expect(confirmMock.mock.calls[0][0]).toBe('dashboard.deleteTemplateConfirm')
    expect(deleteMock).toHaveBeenCalledWith(9)
    expect(messageMock.success).toHaveBeenCalledWith('dashboard.deleteSuccess')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('用户取消时不调用删除接口', async () => {
    confirmMock.mockRejectedValueOnce('cancel')
    const { api, reload } = setup()
    await api.deleteTemplate(makeTemplate())
    expect(deleteMock).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('删除接口失败时不提示成功', async () => {
    deleteMock.mockRejectedValueOnce(new Error('boom'))
    const { api } = setup()
    await api.deleteTemplate(makeTemplate())
    expect(messageMock.success).not.toHaveBeenCalled()
  })
})

describe('useTemplateActions 下拉命令分发', () => {
  it('apply 打开应用对话框，不直接跳转', () => {
    const { api, router, openApply } = setup()
    const item = makeTemplate()
    api.handleCommand('apply', item)
    expect(openApply).toHaveBeenCalledWith(item)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('preview 跳转模板预览路由', () => {
    const { api, router } = setup()
    api.handleCommand('preview', makeTemplate({ id: 3 }))
    expect(router.push).toHaveBeenCalledWith('/preview-template/3')
  })

  it('edit 跳转模板编辑器路由', () => {
    const { api, router } = setup()
    api.handleCommand('edit', makeTemplate({ id: 5 }))
    expect(router.push).toHaveBeenCalledWith('/bi-editor-template/5')
  })

  it('copy / togglePublic / delete 分发到对应逻辑', async () => {
    createMock.mockResolvedValueOnce({})
    const { api, reload } = setup()
    const item = makeTemplate()

    api.handleCommand('copy', item)
    await flush()
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalled()

    api.handleCommand('togglePublic', item)
    await flush()
    expect(updateMock).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()
    confirmMock.mockResolvedValue('confirm')
    deleteMock.mockResolvedValue(null)
    api.handleCommand('delete', item)
    await flush()
    expect(deleteMock).toHaveBeenCalledTimes(1)
  })

  it('未知命令不触发任何操作', async () => {
    const { api, router, reload, openApply } = setup()
    api.handleCommand('unknown', makeTemplate())
    await flush()
    expect(router.push).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
    expect(openApply).not.toHaveBeenCalled()
  })
})

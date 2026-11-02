import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardCreate } from './useDashboardCreate'
import type { DashboardTemplate } from '@/api/types'

const { createMock, moveGroupMock, applyMock, listMock, messageMock } = vi.hoisted(() => ({
  createMock: vi.fn<(data: Record<string, unknown>) => Promise<{ data: { id: number } }>>(),
  moveGroupMock: vi.fn<(id: number, groupId: number) => Promise<unknown>>(),
  applyMock: vi.fn<(id: number, data: Record<string, unknown>) => Promise<{ data: { id: number } }>>(),
  listMock: vi.fn<() => Promise<{ data: DashboardTemplate[] }>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/dashboard', () => ({
  createDashboard: createMock,
  moveDashboardToGroup: moveGroupMock,
}))

vi.mock('@/api/dashboard-template', () => ({
  getDashboardTemplateList: listMock,
  applyTemplate: applyMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
}))

const templates: DashboardTemplate[] = [
  {
    id: 3,
    name: '销售模板',
    description: '描述',
    category: 'sales',
    isPublic: true,
    isSystem: false,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]

function setup() {
  const push = vi.fn<(path: string) => Promise<void>>()
  const close = vi.fn()
  const api = useDashboardCreate({
    router: { push },
    t: (key: string) => key,
    close,
  })
  return { api, push, close }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: templates })
  createMock.mockResolvedValue({ data: { id: 7 } })
  applyMock.mockResolvedValue({ data: { id: 8 } })
  moveGroupMock.mockResolvedValue(undefined)
})

describe('useDashboardCreate 打开与模板加载', () => {
  it('onOpen 重置表单与步骤并加载模板库', async () => {
    const { api } = setup()
    api.createStep.value = 2
    api.selectedUserTplId.value = 3
    api.createForm.name = '旧名称'
    api.createForm.description = '旧描述'
    api.createForm.isPublic = true
    api.createForm.groupId = 5

    api.onOpen()
    expect(api.createStep.value).toBe(1)
    expect(api.selectedUserTplId.value).toBeNull()
    expect(api.createForm).toMatchObject({
      name: '',
      description: '',
      isPublic: false,
      groupId: null,
    })
    expect(api.userTemplatesLoading.value).toBe(true)

    await flush()
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(api.userTemplates.value).toEqual(templates)
    expect(api.userTemplatesLoading.value).toBe(false)
  })

  it('模板加载失败时保持空列表并复位 loading', async () => {
    listMock.mockRejectedValueOnce(new Error('boom'))
    const { api } = setup()

    await api.loadUserTemplatesForCreate()

    expect(api.userTemplates.value).toEqual([])
    expect(api.userTemplatesLoading.value).toBe(false)
  })

  it('选择模板与跳转模板库', () => {
    const { api, push } = setup()
    api.selectUserTemplate(3)
    expect(api.selectedUserTplId.value).toBe(3)

    api.goToTemplateManage()
    expect(push).toHaveBeenCalledWith('/dashboard-templates')
  })
})

describe('useDashboardCreate 步骤切换', () => {
  it('选中模板且名称为空时用模板名预填', () => {
    const { api } = setup()
    api.userTemplates.value = templates
    api.selectedUserTplId.value = 3

    api.goToCreateStep2()

    expect(api.createForm.name).toBe('销售模板_dashboard.title')
    expect(api.createStep.value).toBe(2)
  })

  it('已有名称时不覆盖，未选模板时直接进入步骤 2', () => {
    const { api } = setup()
    api.userTemplates.value = templates
    api.selectedUserTplId.value = 3
    api.createForm.name = '自定义名称'
    api.goToCreateStep2()
    expect(api.createForm.name).toBe('自定义名称')

    api.selectedUserTplId.value = null
    api.createForm.name = ''
    api.goToCreateStep2()
    expect(api.createForm.name).toBe('')
    expect(api.createStep.value).toBe(2)
  })
})

describe('useDashboardCreate 创建看板', () => {
  it('名称为空时提示且不发起请求', async () => {
    const { api, push, close } = setup()
    api.createForm.name = '   '

    await api.confirmCreate()

    expect(messageMock.warning).toHaveBeenCalledWith('dashboard.nameRequired')
    expect(createMock).not.toHaveBeenCalled()
    expect(applyMock).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
  })

  it('未选模板时创建空白看板并跳转编辑器', async () => {
    const { api, push, close } = setup()
    api.createForm.name = '  销售看板  '
    api.createForm.description = '  描述  '
    api.createForm.isPublic = true
    api.createForm.groupId = null

    await api.confirmCreate()

    expect(createMock).toHaveBeenCalledWith({
      name: '销售看板',
      description: '描述',
      isPublic: true,
      groupId: undefined,
    })
    expect(messageMock.success).toHaveBeenCalledWith('dashboard.createSuccess')
    expect(close).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/bi-editor/7')
    expect(api.creating.value).toBe(false)
  })

  it('选中模板时调用 applyTemplate 并更新分组', async () => {
    const { api, push, close } = setup()
    api.selectedUserTplId.value = 3
    api.createForm.name = '模板看板'
    api.createForm.groupId = 5

    await api.confirmCreate()

    expect(applyMock).toHaveBeenCalledWith(3, {
      name: '模板看板',
      description: undefined,
      isPublic: false,
    })
    expect(moveGroupMock).toHaveBeenCalledWith(8, 5)
    expect(close).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/bi-editor/8')
  })

  it('分组更新失败不阻塞创建流程', async () => {
    moveGroupMock.mockRejectedValueOnce(new Error('group failed'))
    const { api, push, close } = setup()
    api.selectedUserTplId.value = 3
    api.createForm.name = '模板看板'
    api.createForm.groupId = 5

    await expect(api.confirmCreate()).resolves.toBeUndefined()

    expect(messageMock.success).toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/bi-editor/8')
  })

  it('创建失败时不关闭对话框并复位 creating', async () => {
    createMock.mockRejectedValueOnce(new Error('boom'))
    const { api, push, close } = setup()
    api.createForm.name = '销售看板'

    await api.confirmCreate()

    expect(close).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(api.creating.value).toBe(false)
  })
})

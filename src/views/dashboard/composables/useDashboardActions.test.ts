import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Router } from 'vue-router'
import type { Dashboard } from '@/api/types'
import { useDashboardActions } from './useDashboardActions'

const { copyMock, updateMock, deleteMock, messageMock, confirmMock } = vi.hoisted(() => ({
  copyMock: vi.fn<(id: number) => Promise<unknown>>(),
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

vi.mock('@/api/dashboard', () => ({
  copyDashboard: copyMock,
  updateDashboard: updateMock,
  deleteDashboard: deleteMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: confirmMock },
}))

function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    id: 7,
    name: '销售看板',
    status: 1,
    isPublic: false,
    ...overrides,
  }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function setup() {
  const router = { push: vi.fn(), replace: vi.fn() } as unknown as Router
  const reload = vi.fn(async () => {})
  const onDeleted = vi.fn(async () => {})
  const loadGroups = vi.fn(async () => {})
  const api = useDashboardActions({ router, reload, onDeleted, loadGroups })
  return { api, router, reload, onDeleted, loadGroups }
}

beforeEach(() => {
  vi.clearAllMocks()
  confirmMock.mockResolvedValue('confirm')
  copyMock.mockResolvedValue({})
  updateMock.mockResolvedValue({})
  deleteMock.mockResolvedValue(null)
})

describe('useDashboardActions 导航与弹窗', () => {
  it('编辑/预览跳转对应路由', () => {
    const { api, router } = setup()
    api.handleEdit(12)
    api.handlePreview(12)

    expect(router.push).toHaveBeenCalledWith('/bi-editor/12')
    expect(router.push).toHaveBeenCalledWith('/preview/12')
  })

  it('打开新建对话框与分组管理对话框（分组管理会刷新分组）', () => {
    const { api, loadGroups } = setup()

    api.openCreateDialog()
    expect(api.createVisible.value).toBe(true)

    api.openGroupDialog()
    expect(api.groupDialogVisible.value).toBe(true)
    expect(loadGroups).toHaveBeenCalledTimes(1)
  })

  it('下拉命令映射到对应弹窗目标', () => {
    const { api } = setup()
    const item = makeDashboard({ id: 9, name: '库存看板' })

    api.handleCommand('rename', item)
    expect(api.renameVisible.value).toBe(true)
    expect(api.renameTarget.value).toStrictEqual(item)
    expect(api.renameValue.value).toBe('库存看板')

    api.handleCommand('moveGroup', item)
    expect(api.moveGroupVisible.value).toBe(true)
    expect(api.moveGroupTarget.value).toStrictEqual(item)

    api.handleCommand('saveAsTemplate', item)
    expect(api.saveTplVisible.value).toBe(true)
    expect(api.saveTplTarget.value).toStrictEqual(item)

    api.handleCommand('share', item)
    expect(api.shareVisible.value).toBe(true)
    expect(api.shareTarget.value).toStrictEqual(item)

    api.handleCommand('report', item)
    expect(api.reportVisible.value).toBe(true)
    expect(api.reportTarget.value).toStrictEqual(item)

    api.handleCommand('versions', item)
    expect(api.versionVisible.value).toBe(true)
    expect(api.versionTarget.value).toStrictEqual(item)
  })

  it('未知命令不改变任何弹窗状态', () => {
    const { api } = setup()
    api.handleCommand('unknown', makeDashboard())

    expect(api.renameVisible.value).toBe(false)
    expect(api.shareVisible.value).toBe(false)
    expect(api.reportVisible.value).toBe(false)
    expect(api.versionVisible.value).toBe(false)
  })
})

describe('useDashboardActions 重命名', () => {
  it('名称为空时提示且不调用接口', async () => {
    const { api } = setup()
    api.renameTarget.value = makeDashboard()
    api.renameValue.value = '   '

    await api.confirmRename()

    expect(messageMock.warning).toHaveBeenCalledWith('看板名称不能为空')
    expect(updateMock).not.toHaveBeenCalled()
    expect(api.renaming.value).toBe(false)
  })

  it('未选择目标时直接返回', async () => {
    const { api } = setup()
    await api.confirmRename()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('成功后更新名称、提示、关闭弹窗并刷新', async () => {
    const { api, reload } = setup()
    api.renameTarget.value = makeDashboard({ id: 5 })
    api.renameValue.value = '  新名称  '

    await api.confirmRename()

    expect(updateMock).toHaveBeenCalledWith(5, { name: '新名称' })
    expect(messageMock.success).toHaveBeenCalledWith('重命名成功')
    expect(api.renameVisible.value).toBe(false)
    expect(api.renaming.value).toBe(false)
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('接口失败时不提示成功且复位 renaming', async () => {
    updateMock.mockRejectedValueOnce(new Error('boom'))
    const { api } = setup()
    api.renameVisible.value = true
    api.renameTarget.value = makeDashboard()
    api.renameValue.value = '新名称'

    await api.confirmRename()

    expect(messageMock.success).not.toHaveBeenCalled()
    expect(api.renameVisible.value).toBe(true)
    expect(api.renaming.value).toBe(false)
  })
})

describe('useDashboardActions 复制与状态切换', () => {
  it('复制确认后调用接口并刷新', async () => {
    const { api, reload } = setup()
    await api.handleCopy(makeDashboard({ id: 3 }))

    expect(confirmMock).toHaveBeenCalledTimes(1)
    expect(copyMock).toHaveBeenCalledWith(3)
    expect(messageMock.success).toHaveBeenCalledWith('复制成功')
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('取消复制时不调用接口', async () => {
    confirmMock.mockRejectedValueOnce('cancel')
    const { api, reload } = setup()
    await api.handleCopy(makeDashboard())

    expect(copyMock).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('已发布看板切换为草稿', async () => {
    const { api, reload } = setup()
    await api.handleToggleStatus(makeDashboard({ status: 1 }))

    expect(updateMock).toHaveBeenCalledWith(7, { status: 0 })
    expect(messageMock.success).toHaveBeenCalledWith('已转为草稿')
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('草稿看板发布', async () => {
    const { api } = setup()
    await api.handleToggleStatus(makeDashboard({ status: 0 }))

    expect(updateMock).toHaveBeenCalledWith(7, { status: 1 })
    expect(messageMock.success).toHaveBeenCalledWith('已发布')
  })

  it('公开状态切换使用取反值', async () => {
    const { api } = setup()
    await api.handleTogglePublic(makeDashboard({ isPublic: false }))
    expect(updateMock).toHaveBeenCalledWith(7, { isPublic: true })
    expect(messageMock.success).toHaveBeenCalledWith('已设为公开')

    await api.handleTogglePublic(makeDashboard({ isPublic: true }))
    expect(updateMock).toHaveBeenLastCalledWith(7, { isPublic: false })
    expect(messageMock.success).toHaveBeenLastCalledWith('已设为私有')
  })
})

describe('useDashboardActions 删除与命令分发', () => {
  it('确认删除后调用接口并交给列表层回退刷新，不直接刷新', async () => {
    const { api, reload, onDeleted } = setup()
    await api.handleDelete(makeDashboard({ id: 4 }))

    expect(deleteMock).toHaveBeenCalledWith(4)
    expect(messageMock.success).toHaveBeenCalledWith('删除成功')
    await flush()
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()
  })

  it('取消删除时不调用接口', async () => {
    confirmMock.mockRejectedValueOnce('cancel')
    const { api, onDeleted } = setup()
    await api.handleDelete(makeDashboard())

    expect(deleteMock).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('copy/toggleStatus/togglePublic/delete 命令分发到对应逻辑', async () => {
    const { api } = setup()
    const item = makeDashboard()

    api.handleCommand('copy', item)
    await flush()
    expect(copyMock).toHaveBeenCalledTimes(1)

    api.handleCommand('toggleStatus', item)
    await flush()
    expect(updateMock).toHaveBeenCalledTimes(1)

    api.handleCommand('togglePublic', item)
    await flush()
    expect(updateMock).toHaveBeenCalledTimes(2)

    api.handleCommand('delete', item)
    await flush()
    expect(deleteMock).toHaveBeenCalledTimes(1)
  })
})

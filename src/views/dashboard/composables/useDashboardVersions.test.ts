import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { DashboardVersion } from '@/api/dashboard-version'
import { useDashboardVersions } from './useDashboardVersions'

const { listMock, detailMock, createMock, restoreMock, deleteMock, messageMock, confirmMock } =
  vi.hoisted(() => ({
    listMock:
      vi.fn<
        (
          id: number,
          params: { page?: number; pageSize?: number; keyword?: string },
        ) => Promise<{ data: { list: DashboardVersion[]; total: number } }>
      >(),
    detailMock: vi.fn<(id: number, versionId: number) => Promise<{ data: DashboardVersion }>>(),
    createMock: vi.fn<(id: number, remark?: string) => Promise<unknown>>(),
    restoreMock: vi.fn<(id: number, versionId: number) => Promise<{ data: { backupVersionNo: number } }>>(),
    deleteMock: vi.fn<(id: number, versionId: number) => Promise<unknown>>(),
    messageMock: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
    confirmMock: vi.fn<(message: string, title: string, options: unknown) => Promise<unknown>>(),
  }))

vi.mock('@/api/dashboard-version', () => ({
  getDashboardVersions: listMock,
  getDashboardVersion: detailMock,
  createDashboardVersion: createMock,
  restoreDashboardVersion: restoreMock,
  deleteDashboardVersion: deleteMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: confirmMock },
}))

function makeVersion(overrides: Partial<DashboardVersion> = {}): DashboardVersion {
  return {
    id: 1,
    dashboardId: 9,
    versionNo: 2,
    name: '销售看板',
    remark: '改版前',
    creatorId: 1,
    createdAt: '2024-01-02T03:04:05.000Z',
    ...overrides,
  }
}

function setup(initialId: number | null = 9) {
  const dashboardId = ref<number | null>(initialId)
  const onRestored = vi.fn()
  const api = useDashboardVersions({
    getDashboardId: () => dashboardId.value,
    onRestored,
  })
  return { api, dashboardId, onRestored }
}

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: { list: [makeVersion()], total: 1 } })
  detailMock.mockResolvedValue({ data: { ...makeVersion(), snapshot: undefined } })
  createMock.mockResolvedValue({})
  restoreMock.mockResolvedValue({ data: { backupVersionNo: 3 } })
  deleteMock.mockResolvedValue({})
  confirmMock.mockResolvedValue(undefined)
})

describe('useDashboardVersions 列表', () => {
  it('按看板与分页参数加载版本列表', async () => {
    const { api } = setup()
    api.page.value = 2

    await api.loadVersions()

    expect(listMock).toHaveBeenCalledWith(9, { page: 2, pageSize: 10, keyword: undefined })
    expect(api.versions.value).toHaveLength(1)
    expect(api.total.value).toBe(1)
    expect(api.loading.value).toBe(false)
  })

  it('无看板时不请求接口', async () => {
    const { api } = setup(null)
    await api.loadVersions()
    expect(listMock).not.toHaveBeenCalled()
  })

  it('加载失败提示错误并复位 loading', async () => {
    listMock.mockRejectedValueOnce(new Error('网络错误'))
    const { api } = setup()

    await api.loadVersions()

    expect(messageMock.error).toHaveBeenCalledWith('网络错误')
    expect(api.loading.value).toBe(false)
  })

  it('搜索回车/清空时回到第一页并重新加载', async () => {
    const { api } = setup()
    api.page.value = 3
    api.keyword.value = '  改版  '

    api.handleSearch()
    await Promise.resolve()

    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenCalledWith(9, { page: 1, pageSize: 10, keyword: '改版' })
  })

  it('handleOpen 重置搜索条件并加载', async () => {
    const { api } = setup()
    api.page.value = 4
    api.keyword.value = '旧关键字'

    api.handleOpen()
    await Promise.resolve()

    expect(api.page.value).toBe(1)
    expect(api.keyword.value).toBe('')
    expect(listMock).toHaveBeenCalledWith(9, { page: 1, pageSize: 10, keyword: undefined })
  })
})

describe('useDashboardVersions 保存', () => {
  it('打开保存弹窗时清空备注', () => {
    const { api } = setup()
    api.remark.value = '旧备注'

    api.openSaveDialog()

    expect(api.remark.value).toBe('')
    expect(api.saveVisible.value).toBe(true)
  })

  it('保存时裁剪备注并刷新列表', async () => {
    const { api } = setup()
    api.remark.value = '  改版前  '
    api.page.value = 2

    await api.confirmSave()

    expect(createMock).toHaveBeenCalledWith(9, '改版前')
    expect(messageMock.success).toHaveBeenCalledWith('版本已保存')
    expect(api.saveVisible.value).toBe(false)
    expect(api.page.value).toBe(1)
    expect(api.saving.value).toBe(false)
    expect(listMock).toHaveBeenCalledTimes(1)
  })

  it('备注为空时传 undefined', async () => {
    const { api } = setup()
    api.remark.value = '   '

    await api.confirmSave()
    expect(createMock).toHaveBeenCalledWith(9, undefined)
  })

  it('保存失败提示错误且不清空 loading', async () => {
    createMock.mockRejectedValueOnce(new Error('保存失败'))
    const { api } = setup()
    api.saveVisible.value = true

    await api.confirmSave()

    expect(messageMock.error).toHaveBeenCalledWith('保存失败')
    expect(api.saving.value).toBe(false)
    expect(api.saveVisible.value).toBe(true)
  })

  it('无看板时不发起保存请求', async () => {
    const { api } = setup(null)
    await api.confirmSave()
    expect(createMock).not.toHaveBeenCalled()
    expect(api.saving.value).toBe(false)
  })
})

describe('useDashboardVersions 详情', () => {
  it('查看版本时加载详情', async () => {
    detailMock.mockResolvedValueOnce({ data: makeVersion({ id: 5 }) })
    const { api } = setup()

    await api.openDetail(makeVersion({ id: 5 }))

    expect(detailMock).toHaveBeenCalledWith(9, 5)
    expect(api.detail.value?.id).toBe(5)
    expect(api.detailVisible.value).toBe(true)
    expect(api.detailLoading.value).toBe(false)
  })

  it('详情加载失败时保持空详情并提示', async () => {
    detailMock.mockRejectedValueOnce(new Error('加载失败'))
    const { api } = setup()

    await api.openDetail(makeVersion({ id: 5 }))

    expect(api.detail.value).toBeNull()
    expect(api.detailVisible.value).toBe(true)
    expect(messageMock.error).toHaveBeenCalledWith('加载失败')
    expect(api.detailLoading.value).toBe(false)
  })

  it('无看板时不发起详情请求', async () => {
    const { api } = setup(null)
    await api.openDetail(makeVersion())
    expect(detailMock).not.toHaveBeenCalled()
  })
})

describe('useDashboardVersions 恢复与删除', () => {
  it('确认后恢复版本并通知刷新', async () => {
    const { api, onRestored } = setup()
    api.detailVisible.value = true

    await api.handleRestore(makeVersion({ id: 5, versionNo: 2 }))

    expect(confirmMock).toHaveBeenCalled()
    expect(restoreMock).toHaveBeenCalledWith(9, 5)
    expect(messageMock.success).toHaveBeenCalledWith('已恢复 v2，当前配置已备份为 v3')
    expect(api.detailVisible.value).toBe(false)
    expect(onRestored).toHaveBeenCalledTimes(1)
    expect(api.page.value).toBe(1)
  })

  it('用户取消确认时不调用恢复接口', async () => {
    confirmMock.mockRejectedValueOnce(new Error('cancel'))
    const { api, onRestored } = setup()

    await api.handleRestore(makeVersion({ id: 5 }))

    expect(restoreMock).not.toHaveBeenCalled()
    expect(onRestored).not.toHaveBeenCalled()
  })

  it('恢复失败时提示错误', async () => {
    restoreMock.mockRejectedValueOnce(new Error('恢复失败'))
    const { api } = setup()

    await api.handleRestore(makeVersion({ id: 5 }))

    expect(messageMock.error).toHaveBeenCalledWith('恢复失败')
  })

  it('删除最后一页唯一版本时回退页码', async () => {
    const { api } = setup()
    api.versions.value = [makeVersion({ id: 5 })]
    api.page.value = 3

    await api.handleDelete(makeVersion({ id: 5 }))

    expect(deleteMock).toHaveBeenCalledWith(9, 5)
    expect(messageMock.success).toHaveBeenCalledWith('版本已删除')
    expect(api.page.value).toBe(2)
    expect(listMock).toHaveBeenCalled()
  })

  it('删除失败时提示错误且不回退页码', async () => {
    deleteMock.mockRejectedValueOnce(new Error('删除失败'))
    const { api } = setup()
    api.versions.value = [makeVersion({ id: 5 })]
    api.page.value = 3

    await api.handleDelete(makeVersion({ id: 5 }))

    expect(messageMock.error).toHaveBeenCalledWith('删除失败')
    expect(api.page.value).toBe(3)
  })

  it('handleClosed 清空列表、分页与弹窗状态', () => {
    const { api } = setup()
    api.versions.value = [makeVersion()]
    api.total.value = 3
    api.page.value = 2
    api.saveVisible.value = true
    api.detailVisible.value = true
    api.detail.value = makeVersion()

    api.handleClosed()

    expect(api.versions.value).toHaveLength(0)
    expect(api.total.value).toBe(0)
    expect(api.page.value).toBe(1)
    expect(api.saveVisible.value).toBe(false)
    expect(api.detailVisible.value).toBe(false)
    expect(api.detail.value).toBeNull()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReportDelivery } from '@/api/report'
import { useReportDeliveries } from './useReportDeliveries'

const { deliveriesMock, markReadMock, messageMock } = vi.hoisted(() => ({
  deliveriesMock:
    vi.fn<
      (params: {
        subscriptionId?: number
        dashboardId?: number
        unreadOnly?: boolean
        page?: number
        pageSize?: number
      }) => Promise<{ data: { list: ReportDelivery[]; total: number } }>
    >(),
  markReadMock: vi.fn<(id: number) => Promise<unknown>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/report', () => ({
  getReportDeliveries: deliveriesMock,
  markReportDeliveryRead: markReadMock,
  getReportSubscriptions: vi.fn(),
  createReportSubscription: vi.fn(),
  updateReportSubscription: vi.fn(),
  deleteReportSubscription: vi.fn(),
  runReportSubscription: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
}))

function makeDelivery(overrides: Partial<ReportDelivery> = {}): ReportDelivery {
  return {
    id: 1,
    subscriptionId: 1,
    dashboardId: 9,
    dashboardName: '销售看板',
    title: '每日报表',
    content: {
      dashboard: { id: 9, name: '销售看板', description: null, chartCount: 2 },
      charts: [],
      generatedAt: '2024-01-02T03:04:05.000Z',
    },
    recipients: 'a@b.com',
    channel: 'inbox',
    status: 'success',
    message: null,
    readFlag: 0,
    createdAt: '2024-01-02T03:04:05.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  deliveriesMock.mockResolvedValue({ data: { list: [makeDelivery()], total: 1 } })
  markReadMock.mockResolvedValue({})
})

describe('useReportDeliveries 加载', () => {
  it('按看板与分页参数加载投递记录', async () => {
    const api = useReportDeliveries({ getDashboardId: () => 9 })
    api.deliveryPage.value = 2

    await api.loadDeliveries()

    expect(deliveriesMock).toHaveBeenCalledWith({ dashboardId: 9, page: 2, pageSize: 10 })
    expect(api.deliveries.value).toHaveLength(1)
    expect(api.deliveryTotal.value).toBe(1)
    expect(api.loadingDeliveries.value).toBe(false)
  })

  it('没有看板时不请求接口', async () => {
    const api = useReportDeliveries({ getDashboardId: () => null })
    await api.loadDeliveries()
    expect(deliveriesMock).not.toHaveBeenCalled()
  })

  it('加载失败提示错误并复位 loading', async () => {
    deliveriesMock.mockRejectedValueOnce(new Error('网络错误'))
    const api = useReportDeliveries({ getDashboardId: () => 9 })

    await expect(api.loadDeliveries()).resolves.toBeUndefined()
    expect(messageMock.error).toHaveBeenCalledWith('网络错误')
    expect(api.loadingDeliveries.value).toBe(false)
  })

  it('未读数使用 unreadOnly 查询，失败归零', async () => {
    deliveriesMock.mockResolvedValueOnce({ data: { list: [], total: 3 } })
    const api = useReportDeliveries({ getDashboardId: () => 9 })

    await api.loadUnreadCount()
    expect(deliveriesMock).toHaveBeenCalledWith({
      dashboardId: 9,
      unreadOnly: true,
      page: 1,
      pageSize: 1,
    })
    expect(api.unreadCount.value).toBe(3)

    deliveriesMock.mockRejectedValueOnce(new Error('boom'))
    await expect(api.loadUnreadCount()).resolves.toBeUndefined()
    expect(api.unreadCount.value).toBe(0)
  })
})

describe('useReportDeliveries 预览', () => {
  it('快照内容合法时打开预览并展示图表', async () => {
    const api = useReportDeliveries({ getDashboardId: () => 9 })
    const row = makeDelivery({ readFlag: 0 })
    api.unreadCount.value = 2

    await api.previewDelivery(row)

    expect(api.previewVisible.value).toBe(true)
    expect(api.previewTitle.value).toBe('每日报表')
    expect(api.snapshot.value?.charts).toEqual([])
    expect(markReadMock).toHaveBeenCalledWith(row.id)
    expect(row.readFlag).toBe(1)
    expect(api.unreadCount.value).toBe(1)
  })

  it('内容不含 charts 时展示错误信息', async () => {
    const api = useReportDeliveries({ getDashboardId: () => 9 })
    const row = makeDelivery({ readFlag: 1, content: { error: '快照不存在' } })

    await api.previewDelivery(row)

    expect(api.previewVisible.value).toBe(true)
    expect(api.snapshot.value).toBeNull()
    expect(api.previewError.value).toBe('快照不存在')
    expect(markReadMock).not.toHaveBeenCalled()
  })

  it('标记已读失败不影响预览', async () => {
    markReadMock.mockRejectedValueOnce(new Error('boom'))
    const api = useReportDeliveries({ getDashboardId: () => 9 })
    const row = makeDelivery({ readFlag: 0 })

    await expect(api.previewDelivery(row)).resolves.toBeUndefined()
    expect(api.previewVisible.value).toBe(true)
    expect(row.readFlag).toBe(0)
  })

  it('resetDeliveries 清空列表、未读数、分页与预览', async () => {
    const api = useReportDeliveries({ getDashboardId: () => 9 })
    api.deliveries.value = [makeDelivery()]
    api.unreadCount.value = 2
    api.deliveryPage.value = 3
    api.deliveryTotal.value = 5
    api.previewVisible.value = true
    api.snapshot.value = makeDelivery().content as never

    api.resetDeliveries()

    expect(api.deliveries.value).toHaveLength(0)
    expect(api.unreadCount.value).toBe(0)
    expect(api.deliveryPage.value).toBe(1)
    expect(api.deliveryTotal.value).toBe(0)
    expect(api.previewVisible.value).toBe(false)
    expect(api.snapshot.value).toBeNull()
  })
})

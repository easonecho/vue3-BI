import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReportDelivery, ReportSubscription } from '@/api/report'
import { useReportSubscriptions } from './useReportSubscriptions'

const { listMock, updateMock, deleteMock, runMock, messageMock } = vi.hoisted(() => ({
  listMock: vi.fn<(dashboardId: number) => Promise<{ data: ReportSubscription[] }>>(),
  updateMock: vi.fn<(id: number, data: unknown) => Promise<unknown>>(),
  deleteMock: vi.fn<(id: number) => Promise<unknown>>(),
  runMock: vi.fn<(id: number) => Promise<{ data: ReportDelivery }>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/report', () => ({
  getReportSubscriptions: listMock,
  updateReportSubscription: updateMock,
  deleteReportSubscription: deleteMock,
  runReportSubscription: runMock,
  getReportDeliveries: vi.fn(),
  createReportSubscription: vi.fn(),
  markReportDeliveryRead: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
}))

function makeSubscription(overrides: Partial<ReportSubscription> = {}): ReportSubscription {
  return {
    id: 1,
    name: '每日销售看板',
    dashboardId: 9,
    cron: '0 9 * * *',
    recipients: null,
    channel: 'inbox',
    webhookUrl: null,
    enabled: true,
    lastRunAt: null,
    lastStatus: null,
    lastMessage: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDelivery(overrides: Partial<ReportDelivery> = {}): ReportDelivery {
  return {
    id: 1,
    subscriptionId: 1,
    dashboardId: 9,
    dashboardName: '销售看板',
    title: '每日报表',
    content: { dashboard: { id: 9, name: '销售看板', description: null, chartCount: 0 }, charts: [], generatedAt: '' },
    recipients: '',
    channel: 'inbox',
    status: 'success',
    message: null,
    readFlag: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setup(activeTab: 'subs' | 'deliveries' = 'subs') {
  const loadUnreadCount = vi.fn(async () => {})
  const loadDeliveries = vi.fn(async () => {})
  const api = useReportSubscriptions({
    getDashboardId: () => 9,
    getActiveTab: () => activeTab,
    loadUnreadCount,
    loadDeliveries,
  })
  return { api, loadUnreadCount, loadDeliveries, activeTab }
}

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: [makeSubscription()] })
  updateMock.mockResolvedValue({})
  deleteMock.mockResolvedValue(null)
  runMock.mockResolvedValue({ data: makeDelivery() })
})

describe('useReportSubscriptions 加载', () => {
  it('按看板加载订阅列表', async () => {
    const { api } = setup()
    await api.loadSubscriptions()

    expect(listMock).toHaveBeenCalledWith(9)
    expect(api.subscriptions.value).toHaveLength(1)
    expect(api.loadingSubs.value).toBe(false)
  })

  it('没有看板时不请求接口', async () => {
    const api = useReportSubscriptions({
      getDashboardId: () => null,
      getActiveTab: () => 'subs',
      loadUnreadCount: vi.fn(),
      loadDeliveries: vi.fn(),
    })
    await api.loadSubscriptions()
    expect(listMock).not.toHaveBeenCalled()
  })

  it('加载失败提示错误', async () => {
    listMock.mockRejectedValueOnce(new Error('加载失败'))
    const { api } = setup()

    await expect(api.loadSubscriptions()).resolves.toBeUndefined()
    expect(messageMock.error).toHaveBeenCalledWith('加载失败')
    expect(api.loadingSubs.value).toBe(false)
  })
})

describe('useReportSubscriptions 行操作', () => {
  it('切换启用状态调用接口并提示', async () => {
    const { api } = setup()
    const row = makeSubscription({ enabled: false })

    await api.toggleEnabled(row)

    expect(updateMock).toHaveBeenCalledWith(1, { enabled: false })
    expect(messageMock.success).toHaveBeenCalledWith('订阅已停用')
  })

  it('切换失败时回滚开关状态', async () => {
    updateMock.mockRejectedValueOnce(new Error('操作失败'))
    const { api } = setup()
    const row = makeSubscription({ enabled: false })

    await api.toggleEnabled(row)

    expect(row.enabled).toBe(true)
    expect(messageMock.error).toHaveBeenCalledWith('操作失败')
  })

  it('删除成功后重新加载列表', async () => {
    const { api } = setup()
    await api.loadSubscriptions()
    await api.removeSubscription(makeSubscription())

    expect(deleteMock).toHaveBeenCalledWith(1)
    expect(messageMock.success).toHaveBeenCalledWith('订阅已删除')
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('立即生成成功后刷新订阅、未读数与当前投递页', async () => {
    const { api, loadUnreadCount, loadDeliveries } = setup('deliveries')
    await api.loadSubscriptions()
    await api.runNow(makeSubscription())

    expect(runMock).toHaveBeenCalledWith(1)
    expect(messageMock.success).toHaveBeenCalledWith('报表已生成')
    expect(listMock).toHaveBeenCalledTimes(2)
    expect(loadUnreadCount).toHaveBeenCalledTimes(1)
    expect(loadDeliveries).toHaveBeenCalledTimes(1)
  })

  it('立即生成返回失败状态时提示错误信息', async () => {
    runMock.mockResolvedValueOnce({ data: makeDelivery({ status: 'failed', message: '执行异常' }) })
    const { api, loadDeliveries } = setup('subs')
    await api.runNow(makeSubscription())

    expect(messageMock.error).toHaveBeenCalledWith('执行异常')
    expect(loadDeliveries).not.toHaveBeenCalled()
  })

  it('生成请求异常时提示错误', async () => {
    runMock.mockRejectedValueOnce(new Error('boom'))
    const { api } = setup()
    await api.runNow(makeSubscription())

    expect(messageMock.error).toHaveBeenCalledWith('boom')
  })
})

describe('useReportSubscriptions 重置', () => {
  it('resetSubscriptions 清空列表', async () => {
    const { api } = setup()
    await api.loadSubscriptions()
    api.resetSubscriptions()
    expect(api.subscriptions.value).toHaveLength(0)
  })
})

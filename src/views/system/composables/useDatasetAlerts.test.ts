import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { AlertEvent, AlertRule } from '@/api/alert'
import { useDatasetAlerts } from './useDatasetAlerts'

const {
  ruleListMock,
  ruleUpdateMock,
  ruleDeleteMock,
  ruleRunMock,
  eventListMock,
  eventReadMock,
  readAllMock,
  detailMock,
  executeMock,
  messageMock,
} = vi.hoisted(() => ({
  ruleListMock: vi.fn<(datasetId: number) => Promise<{ data: AlertRule[] }>>(),
  ruleUpdateMock: vi.fn<(id: number, data: Record<string, unknown>) => Promise<unknown>>(),
  ruleDeleteMock: vi.fn<(id: number) => Promise<unknown>>(),
  ruleRunMock:
    vi.fn<
      (id: number) => Promise<{ data: { triggered: boolean; value: number; eventId: number | null } }>
    >(),
  eventListMock:
    vi.fn<
      (params: Record<string, unknown>) => Promise<{ data: { list: AlertEvent[]; total: number } }>
    >(),
  eventReadMock: vi.fn<(id: number) => Promise<unknown>>(),
  readAllMock: vi.fn<(datasetId: number) => Promise<unknown>>(),
  detailMock: vi.fn<(id: number) => Promise<{ data: { fields: unknown } }>>(),
  executeMock: vi.fn<(id: number, params: unknown) => Promise<{ data: { columns: string[] } }>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/alert', () => ({
  getAlertRules: ruleListMock,
  updateAlertRule: ruleUpdateMock,
  deleteAlertRule: ruleDeleteMock,
  runAlertRule: ruleRunMock,
  getAlertEvents: eventListMock,
  markAlertEventRead: eventReadMock,
  markAllAlertEventsRead: readAllMock,
}))

vi.mock('@/api/dataset', () => ({
  getDatasetDetail: detailMock,
  executeDataset: executeMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
}))

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: 1,
    name: '订单量告警',
    datasetId: 12,
    field: null,
    aggregate: 'count',
    operator: 'gt',
    threshold: 100,
    cron: '0 * * * *',
    enabled: true,
    webhookUrl: null,
    lastRunAt: null,
    lastValue: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeEvent(overrides: Partial<AlertEvent> = {}): AlertEvent {
  return {
    id: 10,
    ruleId: 1,
    ruleName: '订单量告警',
    datasetId: 12,
    value: 50,
    threshold: 100,
    message: '行数低于阈值',
    status: 0,
    createdAt: '2024-01-02T03:04:05.000Z',
    ...overrides,
  }
}

function setup(initialId: number | null = 12) {
  const datasetId = ref<number | null>(initialId)
  const api = useDatasetAlerts({ getDatasetId: () => datasetId.value })
  return { api, datasetId }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.clearAllMocks()
  ruleListMock.mockResolvedValue({ data: [makeRule()] })
  ruleUpdateMock.mockResolvedValue({})
  ruleDeleteMock.mockResolvedValue({})
  ruleRunMock.mockResolvedValue({ data: { triggered: true, value: 50, eventId: 11 } })
  eventListMock.mockResolvedValue({ data: { list: [makeEvent()], total: 1 } })
  eventReadMock.mockResolvedValue({})
  readAllMock.mockResolvedValue({})
  detailMock.mockResolvedValue({ data: { fields: [] } })
  executeMock.mockResolvedValue({ data: { columns: [] } })
})

describe('useDatasetAlerts 加载', () => {
  it('加载规则列表并复位 loading', async () => {
    const { api } = setup()

    await api.loadRules()

    expect(ruleListMock).toHaveBeenCalledWith(12)
    expect(api.rules.value).toHaveLength(1)
    expect(api.loadingRules.value).toBe(false)
  })

  it('无数据集时不加载规则', async () => {
    const { api } = setup(null)
    await api.loadRules()
    expect(ruleListMock).not.toHaveBeenCalled()
  })

  it('加载规则失败提示错误', async () => {
    ruleListMock.mockRejectedValueOnce(new Error('规则加载失败'))
    const { api } = setup()

    await api.loadRules()
    expect(messageMock.error).toHaveBeenCalledWith('规则加载失败')
  })

  it('按分页参数加载告警记录', async () => {
    const { api } = setup()
    api.eventPage.value = 2

    await api.loadEvents()

    expect(eventListMock).toHaveBeenCalledWith({ datasetId: 12, page: 2, pageSize: 10 })
    expect(api.events.value).toHaveLength(1)
    expect(api.eventTotal.value).toBe(1)
    expect(api.loadingEvents.value).toBe(false)
  })

  it('加载未读数量使用 status=0 且只取 1 条', async () => {
    const { api } = setup()

    await api.loadUnreadCount()

    expect(eventListMock).toHaveBeenCalledWith({ datasetId: 12, status: 0, page: 1, pageSize: 1 })
    expect(api.unreadCount.value).toBe(1)
  })

  it('未读数加载失败回退 0', async () => {
    eventListMock.mockRejectedValueOnce(new Error('boom'))
    const { api } = setup()

    await api.loadUnreadCount()
    expect(api.unreadCount.value).toBe(0)
  })

  it('加载字段时合并数据集字段与查询列并去重', async () => {
    detailMock.mockResolvedValueOnce({
      data: { fields: [{ alias: 'order_id', name: 'id' }, { name: 'amount' }] },
    })
    executeMock.mockResolvedValueOnce({ data: { columns: ['amount', 'region'] } })
    const { api } = setup()

    await api.loadFields()

    expect(api.fieldOptions.value).toEqual(['order_id', 'amount', 'region'])
  })

  it('字段明细/取数失败时仍允许手动输入', async () => {
    detailMock.mockRejectedValueOnce(new Error('detail'))
    executeMock.mockRejectedValueOnce(new Error('execute'))
    const { api } = setup()

    await api.loadFields()
    expect(api.fieldOptions.value).toEqual([])
  })

  it('onOpen 并行触发字段/规则/未读数加载', async () => {
    const { api } = setup()

    api.onOpen()
    await flush()

    expect(ruleListMock).toHaveBeenCalledTimes(1)
    expect(eventListMock).toHaveBeenCalledTimes(1)
    expect(detailMock).toHaveBeenCalledTimes(1)
    expect(executeMock).toHaveBeenCalledTimes(1)
  })
})

describe('useDatasetAlerts 规则操作', () => {
  it('启用/停用成功后提示', async () => {
    const { api } = setup()
    const row = makeRule({ enabled: true })

    await api.toggleEnabled(row)

    expect(ruleUpdateMock).toHaveBeenCalledWith(1, { enabled: true })
    expect(messageMock.success).toHaveBeenCalledWith('规则已启用')
  })

  it('启用/停用失败时回滚开关状态', async () => {
    ruleUpdateMock.mockRejectedValueOnce(new Error('更新失败'))
    const { api } = setup()
    const row = makeRule({ enabled: false })

    await api.toggleEnabled(row)

    expect(row.enabled).toBe(true)
    expect(messageMock.error).toHaveBeenCalledWith('更新失败')
  })

  it('删除规则后刷新列表', async () => {
    const { api } = setup()
    ruleListMock.mockClear()

    await api.removeRule(makeRule())

    expect(ruleDeleteMock).toHaveBeenCalledWith(1)
    expect(messageMock.success).toHaveBeenCalledWith('规则已删除')
    expect(ruleListMock).toHaveBeenCalledTimes(1)
  })

  it('立即执行触发告警时刷新未读并刷新规则', async () => {
    ruleListMock.mockClear()
    eventListMock.mockClear()
    const { api } = setup()

    await api.runRule(makeRule())

    expect(messageMock.warning).toHaveBeenCalledWith('已触发告警，当前值 50')
    expect(eventListMock).toHaveBeenCalledTimes(1)
    expect(ruleListMock).toHaveBeenCalledTimes(1)
  })

  it('未触发时不刷新未读数', async () => {
    ruleRunMock.mockResolvedValueOnce({ data: { triggered: false, value: 150, eventId: null } })
    eventListMock.mockClear()
    const { api } = setup()

    await api.runRule(makeRule())

    expect(messageMock.success).toHaveBeenCalledWith('未触发，当前值 150')
    expect(eventListMock).not.toHaveBeenCalled()
  })
})

describe('useDatasetAlerts 告警记录操作', () => {
  it('标记单条已读后更新状态并减少未读数', async () => {
    const { api } = setup()
    api.unreadCount.value = 2
    const event = makeEvent()

    await api.readEvent(event)

    expect(eventReadMock).toHaveBeenCalledWith(10)
    expect(event.status).toBe(1)
    expect(api.unreadCount.value).toBe(1)
  })

  it('标记单条已读失败提示错误', async () => {
    eventReadMock.mockRejectedValueOnce(new Error('已读失败'))
    const { api } = setup()
    const event = makeEvent()

    await api.readEvent(event)

    expect(event.status).toBe(0)
    expect(messageMock.error).toHaveBeenCalledWith('已读失败')
  })

  it('全部已读后清空未读数并刷新列表', async () => {
    const { api } = setup()
    api.unreadCount.value = 3
    eventListMock.mockClear()

    await api.readAll()

    expect(readAllMock).toHaveBeenCalledWith(12)
    expect(messageMock.success).toHaveBeenCalledWith('已全部标记为已读')
    expect(api.unreadCount.value).toBe(0)
    expect(eventListMock).toHaveBeenCalledTimes(1)
  })

  it('无数据集时不执行全部已读', async () => {
    const { api } = setup(null)
    await api.readAll()
    expect(readAllMock).not.toHaveBeenCalled()
  })
})

describe('useDatasetAlerts 关闭清理', () => {
  it('清空规则、记录、未读数与分页', () => {
    const { api } = setup()
    api.rules.value = [makeRule()]
    api.events.value = [makeEvent()]
    api.unreadCount.value = 2
    api.eventPage.value = 3
    api.eventTotal.value = 5

    api.handleClosed()

    expect(api.rules.value).toEqual([])
    expect(api.events.value).toEqual([])
    expect(api.unreadCount.value).toBe(0)
    expect(api.eventPage.value).toBe(1)
    expect(api.eventTotal.value).toBe(0)
  })
})

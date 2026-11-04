import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FormInstance } from 'element-plus'
import type { ReportSubscription } from '@/api/report'
import { useSubscriptionForm } from './useSubscriptionForm'

const { createMock, updateMock, messageMock } = vi.hoisted(() => ({
  createMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  updateMock: vi.fn<(id: number, data: unknown) => Promise<unknown>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/report', () => ({
  createReportSubscription: createMock,
  updateReportSubscription: updateMock,
  getReportSubscriptions: vi.fn(),
  deleteReportSubscription: vi.fn(),
  runReportSubscription: vi.fn(),
  getReportDeliveries: vi.fn(),
  markReportDeliveryRead: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: vi.fn() },
}))

function makeSubscription(overrides: Partial<ReportSubscription> = {}): ReportSubscription {
  return {
    id: 5,
    name: '每日销售看板',
    dashboardId: 9,
    cron: '0 8 * * *',
    recipients: 'a@b.com',
    channel: 'webhook',
    webhookUrl: 'https://example.com/hook',
    webhookSecret: null,
    enabled: false,
    lastRunAt: null,
    lastStatus: null,
    lastMessage: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setup(dashboardId: number | null = 9) {
  const onSaved = vi.fn(async () => {})
  const api = useSubscriptionForm({ getDashboardId: () => dashboardId, onSaved })
  const validate = vi.fn().mockResolvedValue(true)
  api.formRef.value = { validate } as unknown as FormInstance
  return { api, onSaved, validate }
}

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue({})
  updateMock.mockResolvedValue({})
})

describe('useSubscriptionForm 初始化', () => {
  it('initForm(null) 重置为新增默认值', () => {
    const { api } = setup()
    api.form.name = '旧值'
    api.form.channel = 'webhook'

    api.initForm(null)

    expect(api.editingId.value).toBeNull()
    expect(api.form.name).toBe('')
    expect(api.form.cron).toBe('0 9 * * *')
    expect(api.form.channel).toBe('inbox')
    expect(api.form.recipients).toBe('')
    expect(api.form.webhookUrl).toBe('')
    expect(api.form.webhookSecret).toBe('')
    expect(api.form.enabled).toBe(true)
  })

  it('initForm(row) 回填订阅字段，空值转空串', () => {
    const { api } = setup()
    api.initForm(makeSubscription({ recipients: null, webhookUrl: null }))

    expect(api.editingId.value).toBe(5)
    expect(api.form.name).toBe('每日销售看板')
    expect(api.form.cron).toBe('0 8 * * *')
    expect(api.form.channel).toBe('webhook')
    expect(api.form.recipients).toBe('')
    expect(api.form.webhookUrl).toBe('')
    expect(api.form.webhookSecret).toBe('')
    expect(api.form.enabled).toBe(false)
  })

  it('initForm(row) 回填钉钉加签密钥', () => {
    const { api } = setup()
    api.initForm(
      makeSubscription({
        channel: 'dingtalk',
        webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=abc',
        webhookSecret: 'SECdemo123',
      }),
    )

    expect(api.form.channel).toBe('dingtalk')
    expect(api.form.webhookSecret).toBe('SECdemo123')
  })
})

describe('useSubscriptionForm 保存校验', () => {
  it('缺少 formRef 或看板时不保存', async () => {
    const { api } = setup()
    api.formRef.value = undefined
    expect(await api.saveForm()).toBe(false)

    const invalidDashboard = setup(null)
    expect(await invalidDashboard.api.saveForm()).toBe(false)
    expect(createMock).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('表单校验失败时不调用接口', async () => {
    const { api, validate } = setup()
    validate.mockResolvedValueOnce(false)

    expect(await api.saveForm()).toBe(false)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('Webhook 渠道回调地址为空时提示且不保存', async () => {
    const { api } = setup()
    api.form.channel = 'webhook'
    api.form.name = '订阅'
    api.form.webhookUrl = '   '

    expect(await api.saveForm()).toBe(false)
    expect(messageMock.warning).toHaveBeenCalledWith('请填写 Webhook 回调地址')
    expect(createMock).not.toHaveBeenCalled()
  })

  it('机器人地址格式非法时提示且不保存', async () => {
    const { api } = setup()
    api.form.channel = 'wecom'
    api.form.name = '订阅'
    api.form.webhookUrl = 'not-a-url'

    expect(await api.saveForm()).toBe(false)
    expect(messageMock.warning).toHaveBeenCalledWith('地址格式不正确，请填写完整的 URL')
    expect(createMock).not.toHaveBeenCalled()
  })

  it('邮件渠道缺少收件邮箱时提示且不保存', async () => {
    const { api } = setup()
    api.form.channel = 'email'
    api.form.name = '订阅'
    api.form.recipients = '   '

    expect(await api.saveForm()).toBe(false)
    expect(messageMock.warning).toHaveBeenCalledWith('请填写至少一个收件邮箱')
    expect(createMock).not.toHaveBeenCalled()
  })

  it('邮件渠道存在非法收件邮箱时提示且不保存', async () => {
    const { api } = setup()
    api.form.channel = 'email'
    api.form.name = '订阅'
    api.form.recipients = 'bad@, ok@example.com'

    expect(await api.saveForm()).toBe(false)
    expect(messageMock.warning).toHaveBeenCalledWith('收件邮箱格式不正确: bad@')
    expect(createMock).not.toHaveBeenCalled()
  })

  it('钉钉渠道缺少机器人地址时提示且不保存', async () => {
    const { api } = setup()
    api.form.channel = 'dingtalk'
    api.form.name = '订阅'
    api.form.webhookUrl = ''

    expect(await api.saveForm()).toBe(false)
    expect(messageMock.warning).toHaveBeenCalledWith('请填写钉钉机器人地址')
    expect(createMock).not.toHaveBeenCalled()
  })
})

describe('useSubscriptionForm 保存提交', () => {
  it('新增时裁剪字段、空值转 null 并带上 dashboardId', async () => {
    const { api, onSaved } = setup()
    api.form.name = '  每日看板  '
    api.form.cron = ' 0 9 * * * '
    api.form.channel = 'inbox'
    api.form.recipients = '   '
    api.form.webhookUrl = 'https://unused.example.com'

    expect(await api.saveForm()).toBe(true)

    expect(createMock).toHaveBeenCalledWith({
      name: '每日看板',
      cron: '0 9 * * *',
      channel: 'inbox',
      recipients: null,
      webhookUrl: null,
      webhookSecret: null,
      enabled: true,
      dashboardId: 9,
    })
    expect(messageMock.success).toHaveBeenCalledWith('订阅已创建')
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(api.saving.value).toBe(false)
  })

  it('编辑时调用更新接口且不携带 dashboardId', async () => {
    const { api, onSaved } = setup()
    api.initForm(makeSubscription())
    api.form.name = '  新名称  '

    expect(await api.saveForm()).toBe(true)

    expect(updateMock).toHaveBeenCalledWith(5, {
      name: '新名称',
      cron: '0 8 * * *',
      channel: 'webhook',
      recipients: 'a@b.com',
      webhookUrl: 'https://example.com/hook',
      webhookSecret: null,
      enabled: false,
    })
    expect(messageMock.success).toHaveBeenCalledWith('订阅已更新')
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it('接口失败时提示错误并返回 false，复位 saving', async () => {
    updateMock.mockRejectedValueOnce(new Error('保存失败'))
    const { api, onSaved } = setup()
    api.initForm(makeSubscription())

    expect(await api.saveForm()).toBe(false)
    expect(messageMock.error).toHaveBeenCalledWith('保存失败')
    expect(onSaved).not.toHaveBeenCalled()
    expect(api.saving.value).toBe(false)
  })
})

describe('useSubscriptionForm 渠道切换与新渠道提交', () => {
  it('切换到站内渠道时清空机器人地址与加签密钥', () => {
    const { api } = setup()
    api.form.channel = 'dingtalk'
    api.form.webhookUrl = 'https://oapi.dingtalk.com/robot/send?access_token=abc'
    api.form.webhookSecret = 'SECdemo123'
    api.form.recipients = 'a@b.com'

    api.form.channel = 'inbox'
    api.handleChannelChange()

    expect(api.form.webhookUrl).toBe('')
    expect(api.form.webhookSecret).toBe('')
    expect(api.form.recipients).toBe('a@b.com')
  })

  it('切换到机器人渠道时清空收件人与加签密钥', () => {
    const { api } = setup()
    api.form.recipients = 'a@b.com'
    api.form.webhookUrl = 'https://example.com/hook'
    api.form.webhookSecret = 'SECdemo123'

    api.form.channel = 'wecom'
    api.handleChannelChange()

    expect(api.form.recipients).toBe('')
    expect(api.form.webhookSecret).toBe('')
    expect(api.form.webhookUrl).toBe('https://example.com/hook')
  })

  it('邮件渠道提交收件邮箱且不携带机器人配置', async () => {
    const { api } = setup()
    api.form.name = '每日邮件报表'
    api.form.channel = 'email'
    api.form.recipients = 'a@example.com, b@example.com'
    api.form.webhookUrl = 'https://stale.example.com/hook'
    api.form.webhookSecret = 'stale-secret'

    expect(await api.saveForm()).toBe(true)

    expect(createMock).toHaveBeenCalledWith({
      name: '每日邮件报表',
      cron: '0 9 * * *',
      channel: 'email',
      recipients: 'a@example.com, b@example.com',
      webhookUrl: null,
      webhookSecret: null,
      enabled: true,
      dashboardId: 9,
    })
  })

  it('企业微信渠道提交机器人地址', async () => {
    const { api } = setup()
    const url = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc'
    api.form.name = '企微日报'
    api.form.channel = 'wecom'
    api.form.webhookUrl = url

    expect(await api.saveForm()).toBe(true)

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'wecom',
        webhookUrl: url,
        webhookSecret: null,
      }),
    )
  })

  it('钉钉渠道提交机器人地址与加签密钥', async () => {
    const { api } = setup()
    const url = 'https://oapi.dingtalk.com/robot/send?access_token=abc'
    api.form.name = '钉钉日报'
    api.form.channel = 'dingtalk'
    api.form.webhookUrl = url
    api.form.webhookSecret = ' SECdemo123 '

    expect(await api.saveForm()).toBe(true)

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'dingtalk',
        webhookUrl: url,
        webhookSecret: 'SECdemo123',
      }),
    )
  })
})

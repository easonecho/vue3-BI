import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FormInstance } from 'element-plus'
import type { AlertRule } from '@/api/alert'
import { DEFAULT_ALERT_CRON, useDatasetAlertRuleForm } from './useDatasetAlertRuleForm'

const { createMock, updateMock, messageMock } = vi.hoisted(() => ({
  createMock: vi.fn<(data: Record<string, unknown>) => Promise<unknown>>(),
  updateMock: vi.fn<(id: number, data: Record<string, unknown>) => Promise<unknown>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/alert', () => ({
  createAlertRule: createMock,
  updateAlertRule: updateMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
}))

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: 3,
    name: '销售告警',
    datasetId: 12,
    field: 'amount',
    aggregate: 'sum',
    operator: 'gte',
    threshold: 1000,
    cron: '0 9 * * *',
    enabled: false,
    webhookUrl: 'https://hook.example.com',
    lastRunAt: null,
    lastValue: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setup(initialId: number | null = 12) {
  const api = useDatasetAlertRuleForm({ getDatasetId: () => initialId })
  return { api, id: initialId }
}

function stubValidation(api: ReturnType<typeof setup>['api'], valid = true) {
  const validate = vi.fn().mockResolvedValue(valid)
  api.formRef.value = { validate } as unknown as FormInstance
  return validate
}

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue({})
  updateMock.mockResolvedValue({})
})

describe('useDatasetAlertRuleForm 初始化', () => {
  it('新增时重置为默认值', () => {
    const { api } = setup()
    api.initForm(makeRule())
    api.form.name = '旧值'

    api.initForm(null)

    expect(api.editingId.value).toBeNull()
    expect(api.form).toMatchObject({
      name: '',
      field: '',
      aggregate: 'count',
      operator: 'gt',
      threshold: 0,
      cron: DEFAULT_ALERT_CRON,
      webhookUrl: '',
      enabled: true,
    })
  })

  it('编辑时回填规则字段并对空值做兜底', () => {
    const { api } = setup()

    api.initForm(makeRule({ field: null, webhookUrl: null }))

    expect(api.editingId.value).toBe(3)
    expect(api.form.name).toBe('销售告警')
    expect(api.form.field).toBe('')
    expect(api.form.webhookUrl).toBe('')
    expect(api.form.aggregate).toBe('sum')
    expect(api.form.operator).toBe('gte')
    expect(api.form.threshold).toBe(1000)
    expect(api.form.enabled).toBe(false)
  })
})

describe('useDatasetAlertRuleForm 校验', () => {
  it('表单实例缺失时直接返回 false', async () => {
    const { api } = setup()
    api.initForm(null)

    await expect(api.saveForm()).resolves.toBe(false)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('校验失败时不提交', async () => {
    const { api } = setup()
    stubValidation(api, false)

    await expect(api.saveForm()).resolves.toBe(false)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('非 count 聚合缺少字段时提示并阻止提交', async () => {
    const { api } = setup()
    stubValidation(api)
    api.form.name = '告警'
    api.form.aggregate = 'sum'
    api.form.field = ''

    await expect(api.saveForm()).resolves.toBe(false)
    expect(messageMock.warning).toHaveBeenCalledWith('非 count 聚合必须选择字段')
    expect(createMock).not.toHaveBeenCalled()
  })

  it('无数据集时不提交', async () => {
    const { api } = setup(null)
    stubValidation(api)
    api.form.name = '告警'

    await expect(api.saveForm()).resolves.toBe(false)
    expect(createMock).not.toHaveBeenCalled()
  })
})

describe('useDatasetAlertRuleForm 保存', () => {
  it('新增时裁剪文本并提交 datasetId', async () => {
    const { api } = setup()
    stubValidation(api)
    api.form.name = '  日订单量告警  '
    api.form.aggregate = 'count'
    api.form.field = ''
    api.form.threshold = 100
    api.form.cron = '0 * * * *'
    api.form.webhookUrl = '  https://hook.example.com  '
    api.form.enabled = true

    await expect(api.saveForm()).resolves.toBe(true)

    expect(createMock).toHaveBeenCalledWith({
      name: '日订单量告警',
      field: null,
      aggregate: 'count',
      operator: 'gt',
      threshold: 100,
      cron: '0 * * * *',
      webhookUrl: 'https://hook.example.com',
      enabled: true,
      datasetId: 12,
    })
    expect(messageMock.success).toHaveBeenCalledWith('规则已创建')
    expect(api.saving.value).toBe(false)
  })

  it('编辑时调用更新接口且不携带 datasetId', async () => {
    const { api } = setup()
    stubValidation(api)
    api.initForm(makeRule())

    await expect(api.saveForm()).resolves.toBe(true)

    expect(updateMock).toHaveBeenCalledWith(3, {
      name: '销售告警',
      field: 'amount',
      aggregate: 'sum',
      operator: 'gte',
      threshold: 1000,
      cron: '0 9 * * *',
      webhookUrl: 'https://hook.example.com',
      enabled: false,
    })
    expect(messageMock.success).toHaveBeenCalledWith('规则已更新')
  })

  it('保存失败返回 false 并复位 saving', async () => {
    createMock.mockRejectedValueOnce(new Error('保存失败'))
    const { api } = setup()
    stubValidation(api)
    api.form.name = '告警'

    await expect(api.saveForm()).resolves.toBe(false)

    expect(messageMock.error).toHaveBeenCalledWith('保存失败')
    expect(api.saving.value).toBe(false)
  })

  it('空 webhook 提交 null', async () => {
    const { api } = setup()
    stubValidation(api)
    api.form.name = '告警'
    api.form.webhookUrl = '   '

    await api.saveForm()
    expect(createMock.mock.calls[0][0].webhookUrl).toBeNull()
  })
})

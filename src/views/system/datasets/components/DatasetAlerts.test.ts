import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { AlertEvent, AlertRule } from '@/api/alert'
import DatasetAlerts from './DatasetAlerts.vue'

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

const rule: AlertRule = {
  id: 3,
  name: '销售告警',
  datasetId: 12,
  field: 'amount',
  aggregate: 'sum',
  operator: 'gte',
  threshold: 1000,
  cron: '0 9 * * *',
  enabled: true,
  webhookUrl: null,
  lastRunAt: null,
  lastValue: null,
  createdAt: '2024-01-01T00:00:00.000Z',
}

const event: AlertEvent = {
  id: 10,
  ruleId: 3,
  ruleName: '销售告警',
  datasetId: 12,
  value: 50,
  threshold: 100,
  message: '行数低于阈值',
  status: 0,
  createdAt: '2024-01-02T03:04:05.000Z',
}

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue', 'closed'],
  template: '<div class="dialog-stub" :data-title="title"><slot /></div>',
})

const TabsStub = defineComponent({
  name: 'ElTabs',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="tabs-stub"><slot /></div>',
})

const RulesTabStub = defineComponent({
  name: 'DatasetAlertRulesTab',
  props: ['rules', 'loading'],
  emits: ['create', 'refresh', 'toggle-enabled', 'run', 'edit', 'delete'],
  template: '<div class="rules-tab-stub" :data-count="rules.length" />',
})

const EventsTabStub = defineComponent({
  name: 'DatasetAlertEventsTab',
  props: ['events', 'loading', 'unreadCount', 'total', 'pageSize', 'page'],
  emits: ['update:page', 'refresh', 'read-all', 'read-event'],
  template: '<div class="events-tab-stub" :data-count="events.length" />',
})

const FormStub = defineComponent({
  name: 'DatasetAlertRuleFormDialog',
  props: ['modelValue', 'datasetId', 'editing', 'fieldOptions'],
  emits: ['update:modelValue', 'saved'],
  template: '<div class="form-stub" :data-open="modelValue" :data-editing-id="editing && editing.id" />',
})

const stubs = {
  'el-dialog': DialogStub,
  'el-tabs': TabsStub,
  'el-tab-pane': {
    props: ['label', 'name'],
    template: '<div class="tab-pane-stub"><slot /><slot name="label" /></div>',
  },
  'el-badge': {
    props: ['value'],
    template: '<span class="badge-stub">{{ value }}</span>',
  },
  DatasetAlertRulesTab: RulesTabStub,
  DatasetAlertEventsTab: EventsTabStub,
  DatasetAlertRuleFormDialog: FormStub,
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.clearAllMocks()
  ruleListMock.mockResolvedValue({ data: [rule] })
  ruleUpdateMock.mockResolvedValue({})
  ruleDeleteMock.mockResolvedValue({})
  ruleRunMock.mockResolvedValue({ data: { triggered: true, value: 50, eventId: 11 } })
  eventListMock.mockResolvedValue({ data: { list: [event], total: 1 } })
  eventReadMock.mockResolvedValue({})
  readAllMock.mockResolvedValue({})
  detailMock.mockResolvedValue({ data: { fields: [{ name: 'amount' }] } })
  executeMock.mockResolvedValue({ data: { columns: ['amount'] } })
})

function mountDialog(modelValue = false) {
  return mount(DatasetAlerts, {
    props: {
      modelValue,
      dataset: { id: 12, name: '销售数据集' },
    },
    global: { stubs },
  })
}

describe('DatasetAlerts 打开与加载', () => {
  it('打开时并行加载规则/字段/未读数并展示标题', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    await flush()

    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('告警订阅 - 销售数据集')
    expect(ruleListMock).toHaveBeenCalledWith(12)
    expect(detailMock).toHaveBeenCalledWith(12)
    expect(executeMock).toHaveBeenCalledWith(12, { limit: 1 })
    expect(eventListMock).toHaveBeenCalledWith({ datasetId: 12, status: 0, page: 1, pageSize: 1 })
    expect(wrapper.findComponent(RulesTabStub).props('rules')).toEqual([rule])
    expect(wrapper.findComponent(FormStub).props('fieldOptions')).toEqual(['amount'])
  })

  it('切换到告警记录时加载分页数据', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    eventListMock.mockClear()

    wrapper.findComponent(TabsStub).vm.$emit('update:modelValue', 'events')
    await wrapper.vm.$nextTick()
    await flush()

    expect(eventListMock).toHaveBeenCalledWith({ datasetId: 12, page: 1, pageSize: 10 })
    expect(wrapper.findComponent(EventsTabStub).props('events')).toEqual([event])
  })

  it('关闭时清空数据并关闭规则表单', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent(RulesTabStub).vm.$emit('edit', rule)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(FormStub).props('modelValue')).toBe(true)

    wrapper.findComponent(DialogStub).vm.$emit('closed')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(RulesTabStub).props('rules')).toEqual([])
    expect(wrapper.findComponent(EventsTabStub).props('events')).toEqual([])
    expect(wrapper.findComponent(FormStub).props('modelValue')).toBe(false)
    expect(wrapper.findComponent(FormStub).props('editing')).toBeNull()
  })
})

describe('DatasetAlerts 规则与记录交互', () => {
  it('新增规则打开表单并清空编辑目标', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent(RulesTabStub).vm.$emit('create')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(FormStub).props('modelValue')).toBe(true)
    expect(wrapper.findComponent(FormStub).props('editing')).toBeNull()
  })

  it('编辑规则带入目标行，保存后刷新规则', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    ruleListMock.mockClear()

    wrapper.findComponent(RulesTabStub).vm.$emit('edit', rule)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(FormStub).props('editing')).toEqual(rule)

    wrapper.findComponent(FormStub).vm.$emit('saved')
    await flush()

    expect(ruleListMock).toHaveBeenCalledTimes(1)
  })

  it('规则操作透传到 API', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    const rulesTab = wrapper.findComponent(RulesTabStub)

    rulesTab.vm.$emit('toggle-enabled', { ...rule, enabled: false })
    await flush()
    expect(ruleUpdateMock).toHaveBeenCalledWith(3, { enabled: false })

    rulesTab.vm.$emit('delete', rule)
    await flush()
    expect(ruleDeleteMock).toHaveBeenCalledWith(3)

    rulesTab.vm.$emit('run', rule)
    await flush()
    expect(ruleRunMock).toHaveBeenCalledWith(3)
  })

  it('告警记录操作透传到 API', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    const eventsTab = wrapper.findComponent(EventsTabStub)

    eventsTab.vm.$emit('read-event', event)
    await flush()
    expect(eventReadMock).toHaveBeenCalledWith(10)

    eventsTab.vm.$emit('read-all')
    await flush()
    expect(readAllMock).toHaveBeenCalledWith(12)
  })
})

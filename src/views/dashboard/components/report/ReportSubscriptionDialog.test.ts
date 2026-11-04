import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import type { ReportDelivery, ReportSubscription } from '@/api/report'
import ReportSubscriptionDialog from './ReportSubscriptionDialog.vue'

const { listMock, deliveriesMock, messageMock } = vi.hoisted(() => ({
  listMock: vi.fn<(dashboardId: number) => Promise<{ data: ReportSubscription[] }>>(),
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
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/report', () => ({
  getReportSubscriptions: listMock,
  getReportDeliveries: deliveriesMock,
  createReportSubscription: vi.fn(),
  updateReportSubscription: vi.fn(),
  deleteReportSubscription: vi.fn(),
  runReportSubscription: vi.fn(),
  markReportDeliveryRead: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: vi.fn() },
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
    webhookSecret: null,
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
    content: {
      dashboard: { id: 9, name: '销售看板', description: null, chartCount: 0 },
      charts: [],
      generatedAt: '2024-01-02T00:00:00.000Z',
    },
    recipients: '',
    channel: 'inbox',
    status: 'success',
    message: null,
    readFlag: 1,
    createdAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

const stubs = {
  'el-dialog': {
    name: 'ElDialog',
    props: ['modelValue', 'title'],
    emits: ['update:modelValue', 'closed'],
    template: '<div class="dialog-stub"><slot /></div>',
  },
  'el-tabs': {
    name: 'ElTabs',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="tabs-stub"><slot /></div>',
  },
  'el-tab-pane': {
    name: 'ElTabPane',
    props: ['label', 'name'],
    template: '<div class="pane-stub"><slot /><slot name="label" /></div>',
  },
  'el-badge': { template: '<span class="badge-stub"><slot /></span>' },
  ReportSubscriptionsTab: {
    name: 'ReportSubscriptionsTab',
    props: ['subscriptions', 'loading'],
    emits: ['create', 'refresh', 'toggle-enabled', 'edit', 'delete', 'run-now'],
    template: '<div class="subs-tab-stub" />',
  },
  ReportDeliveriesTab: {
    name: 'ReportDeliveriesTab',
    props: ['deliveries', 'loading', 'total', 'pageSize', 'page'],
    emits: ['refresh', 'preview', 'update:page'],
    template: '<div class="deliveries-tab-stub" />',
  },
  ReportSubscriptionFormDialog: {
    name: 'ReportSubscriptionFormDialog',
    props: ['modelValue', 'dashboardId', 'editing'],
    emits: ['update:modelValue', 'saved'],
    template: '<div class="form-stub" />',
  },
  ReportSnapshotPreview: {
    name: 'ReportSnapshotPreview',
    props: ['modelValue', 'title', 'error', 'snapshot'],
    emits: ['update:modelValue'],
    template: '<div class="preview-stub" />',
  },
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function mountDialog() {
  return mount(ReportSubscriptionDialog, {
    props: { modelValue: false, dashboard: { id: 9, name: '销售看板' } },
    global: { stubs },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: [makeSubscription()] })
  deliveriesMock.mockImplementation(async (params) => ({
    data: { list: [makeDelivery()], total: params.unreadOnly ? 2 : 5 },
  }))
})

describe('ReportSubscriptionDialog 生命周期', () => {
  it('打开对话框时加载订阅与未读数，并回到订阅配置 tab', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flush()

    expect(listMock).toHaveBeenCalledWith(9)
    expect(deliveriesMock).toHaveBeenCalledWith({
      dashboardId: 9,
      unreadOnly: true,
      page: 1,
      pageSize: 1,
    })
    expect(wrapper.findComponent({ name: 'ElTabs' }).props('modelValue')).toBe('subs')
  })

  it('切换到投递记录 tab 时加载投递列表', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent({ name: 'ElTabs' }).vm.$emit('update:modelValue', 'deliveries')
    await flush()

    expect(deliveriesMock).toHaveBeenLastCalledWith({
      dashboardId: 9,
      page: 1,
      pageSize: 10,
    })
  })

  it('关闭对话框时清空列表、未读数与表单状态', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent({ name: 'ElTabs' }).vm.$emit('update:modelValue', 'deliveries')
    await flush()

    const subsTab = wrapper.findComponent({ name: 'ReportSubscriptionsTab' })
    const deliveriesTab = wrapper.findComponent({ name: 'ReportDeliveriesTab' })
    expect(subsTab.props('subscriptions')).toHaveLength(1)
    expect(deliveriesTab.props('deliveries')).toHaveLength(1)
    expect(wrapper.find('.badge-stub').exists()).toBe(true)

    wrapper.findComponent({ name: 'ElDialog' }).vm.$emit('closed')
    await nextTick()

    expect(subsTab.props('subscriptions')).toHaveLength(0)
    expect(deliveriesTab.props('deliveries')).toHaveLength(0)
    expect(wrapper.find('.badge-stub').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'ReportSubscriptionFormDialog' }).props('modelValue')).toBe(
      false,
    )
  })
})

describe('ReportSubscriptionDialog 表单与预览联动', () => {
  it('新增与编辑分别设置表单目标', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent({ name: 'ReportSubscriptionsTab' }).vm.$emit('create')
    await nextTick()
    const form = wrapper.findComponent({ name: 'ReportSubscriptionFormDialog' })
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('editing')).toBeNull()
    expect(form.props('dashboardId')).toBe(9)

    const row = makeSubscription({ id: 5 })
    wrapper.findComponent({ name: 'ReportSubscriptionsTab' }).vm.$emit('edit', row)
    await nextTick()
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('editing')).toStrictEqual(row)
  })

  it('表单保存成功后重新加载订阅列表', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent({ name: 'ReportSubscriptionFormDialog' }).vm.$emit('saved')
    await flush()

    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('投递记录查看事件打开快照预览', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent({ name: 'ReportDeliveriesTab' }).vm.$emit('preview', makeDelivery())
    await flush()

    const preview = wrapper.findComponent({ name: 'ReportSnapshotPreview' })
    expect(preview.props('modelValue')).toBe(true)
    expect(preview.props('title')).toBe('每日报表')
    expect(preview.props('snapshot')).not.toBeNull()
  })
})

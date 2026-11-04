import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ChartDetailDrawer from './ChartDetailDrawer.vue'

const { pageMock, publicPageMock } = vi.hoisted(() => ({
  pageMock: vi.fn(),
  publicPageMock: vi.fn(),
}))

vi.mock('@/views/bi-editor/composables/dataset-batch', () => ({
  requestDatasetPage: pageMock,
}))

vi.mock('@/api/share', () => ({
  fetchPublicDatasetPage: publicPageMock,
}))

const DrawerStub = defineComponent({
  name: 'ElDrawer',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue'],
  template: '<div v-if="modelValue" class="drawer-stub" :data-title="title"><slot /></div>',
})

const TableStub = defineComponent({
  name: 'ElTable',
  props: ['data'],
  emits: ['sort-change'],
  template: '<div class="table-stub" :data-count="data.length"><slot /></div>',
})

const TableColumnStub = defineComponent({
  name: 'ElTableColumn',
  props: ['prop', 'label'],
  template: '<span class="col-stub" :data-prop="prop" />',
})

const AlertStub = defineComponent({
  name: 'ElAlert',
  props: ['title'],
  template: '<div class="alert-stub" :data-title="title" />',
})

const ButtonStub = defineComponent({
  name: 'ElButton',
  props: ['disabled'],
  emits: ['click'],
  template: '<button class="btn-stub" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
})

const stubs = {
  'el-drawer': DrawerStub,
  'el-table': TableStub,
  'el-table-column': TableColumnStub,
  'el-alert': AlertStub,
  'el-button': ButtonStub,
  'el-tag': { template: '<span class="tag-stub"><slot /></span>' },
  'el-empty': { template: '<div class="empty-stub" />' },
}

const defaultFilters = [{ field: 'region', operator: 'eq' as const, value: '华东' }]

function mountDrawer(props: Record<string, unknown> = {}) {
  return mount(ChartDetailDrawer, {
    props: {
      visible: true,
      datasetId: 7,
      title: '销售图表',
      filters: defaultFilters,
      ...props,
    },
    global: {
      stubs,
      directives: { loading: () => undefined },
    },
  })
}

function pageResult(overrides: Record<string, unknown> = {}) {
  return {
    columns: ['region', 'amount'],
    rows: [{ region: '华东', amount: 100 }],
    rowCount: 1,
    offset: 0,
    limit: 50,
    hasMore: false,
    truncated: false,
    total: 1,
    ...overrides,
  }
}

beforeEach(() => {
  pageMock.mockReset()
  publicPageMock.mockReset()
  pageMock.mockResolvedValue(pageResult())
  publicPageMock.mockResolvedValue({ data: pageResult() })
})

describe('ChartDetailDrawer', () => {
  it('打开时按当前过滤条件加载第一页并渲染表格', async () => {
    const wrapper = mountDrawer()
    await flushPromises()

    expect(pageMock).toHaveBeenCalledTimes(1)
    expect(pageMock).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ offset: 0, limit: 50, filters: defaultFilters }),
    )
    expect(wrapper.find('.table-stub').attributes('data-count')).toBe('1')
    expect(wrapper.find('.detail-count').text()).toContain('1')
    expect(wrapper.findAll('.col-stub').map((node) => node.attributes('data-prop'))).toEqual([
      'region',
      'amount',
    ])
    expect(wrapper.find('.detail-filter-tag').text()).toBe('region = 华东')
  })

  it('visible=false 时不发起请求', async () => {
    mountDrawer({ visible: false })
    await flushPromises()
    expect(pageMock).not.toHaveBeenCalled()
  })

  it('翻页使用 offset 递增；过滤条件变化后重置到第一页', async () => {
    pageMock.mockResolvedValue(pageResult({ hasMore: true }))
    const wrapper = mountDrawer()
    await flushPromises()

    const nextButton = wrapper
      .findAll('.btn-stub')
      .find((btn) => btn.text().includes('下一页'))
    if (!nextButton) throw new Error('未找到下一页按钮')
    await nextButton.trigger('click')
    await flushPromises()
    expect(pageMock).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({ offset: 50, limit: 50 }),
    )

    pageMock.mockResolvedValue(pageResult())
    await wrapper.setProps({ filters: [{ field: 'city', operator: 'eq', value: '上海' }] })
    await flushPromises()
    expect(pageMock).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({ offset: 0, filters: [{ field: 'city', operator: 'eq', value: '上海' }] }),
    )
  })

  it('排序变化时携带 sortBy / sortOrder 重新请求', async () => {
    const wrapper = mountDrawer()
    await flushPromises()

    await wrapper.findComponent(TableStub).vm.$emit('sort-change', {
      prop: 'amount',
      order: 'ascending',
    })
    await flushPromises()

    expect(pageMock).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({ sortBy: 'amount', sortOrder: 'asc' }),
    )

    await wrapper.findComponent(TableStub).vm.$emit('sort-change', { prop: 'amount', order: null })
    await flushPromises()
    expect(pageMock).toHaveBeenLastCalledWith(
      7,
      expect.not.objectContaining({ sortBy: 'amount' }),
    )
  })

  it('加载失败展示错误提示', async () => {
    pageMock.mockRejectedValue(new Error('明细查询失败'))
    const wrapper = mountDrawer()
    await flushPromises()

    expect(wrapper.find('.alert-stub').attributes('data-title')).toBe('明细查询失败')
    expect(wrapper.find('.table-stub').attributes('data-count')).toBe('0')
  })

  it('公开分享页走匿名分页接口并解包 data', async () => {
    const { setPublicDashboardContext, clearPublicDashboardContext } = await import(
      '@/utils/public-dashboard-context'
    )
    setPublicDashboardContext({ token: 'share-token' })
    try {
      const wrapper = mountDrawer()
      await flushPromises()
      expect(pageMock).not.toHaveBeenCalled()
      expect(publicPageMock).toHaveBeenCalledWith(
        'share-token',
        7,
        expect.objectContaining({ password: undefined }),
      )
      expect(wrapper.find('.table-stub').attributes('data-count')).toBe('1')
    } finally {
      clearPublicDashboardContext()
    }
  })
})

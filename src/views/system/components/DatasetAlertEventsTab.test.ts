import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { AlertEvent } from '@/api/alert'
import DatasetAlertEventsTab from './DatasetAlertEventsTab.vue'

/** 表格 stub 只渲染一行，需在 mount 前按用例首行数据赋值 */
let currentRow: Record<string, unknown> = {}

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  props: ['label', 'prop'],
  setup() {
    return { row: currentRow }
  },
  template:
    '<div class="column-stub"><template v-if="prop">{{ row[prop] }}</template><slot v-else :row="row" /></div>',
})

const stubs = {
  'el-table': {
    name: 'ElTable',
    props: ['data'],
    template: '<div class="table-stub"><slot /></div>',
  },
  'el-table-column': ElTableColumnStub,
  'el-tag': { template: '<span class="tag-stub"><slot /></span>' },
  'el-button': {
    props: ['disabled'],
    emits: ['click'],
    template: `<button class="btn-stub" :disabled="disabled" @click="$emit('click')"><slot></slot></button>`,
  },
  'el-empty': { template: '<div class="empty-stub">暂无告警记录</div>' },
  'el-pagination': {
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['update:current-page', 'current-change'],
    template:
      '<div class="pager-stub"><button class="page-next" @click="$emit(\'current-change\', 2)"></button></div>',
  },
}

const directives = {
  loading: { mounted: () => {} },
}

function makeEvent(overrides: Partial<AlertEvent> = {}): AlertEvent {
  return {
    id: 10,
    ruleId: 3,
    ruleName: '销售告警',
    datasetId: 12,
    value: 50,
    threshold: 100,
    message: '行数低于阈值',
    status: 0,
    createdAt: '2024-01-02T03:04:05.000Z',
    ...overrides,
  }
}

function mountTab(props: {
  events?: AlertEvent[]
  loading?: boolean
  unreadCount?: number
  total?: number
  pageSize?: number
} = {}) {
  currentRow = (props.events?.[0] ?? {}) as Record<string, unknown>
  return mount(DatasetAlertEventsTab, {
    props: {
      events: props.events ?? [],
      loading: props.loading ?? false,
      unreadCount: props.unreadCount ?? 0,
      total: props.total ?? 0,
      pageSize: props.pageSize ?? 10,
      page: 1,
    },
    global: { stubs, directives },
  })
}

describe('DatasetAlertEventsTab 渲染', () => {
  it('展示规则、告警内容、未读状态与时间', () => {
    const wrapper = mountTab({ events: [makeEvent()], unreadCount: 1 })
    const text = wrapper.text()

    expect(text).toContain('销售告警')
    expect(text).toContain('行数低于阈值')
    expect(text).toContain('未读')
    expect(wrapper.find('.empty-stub').exists()).toBe(false)
  })

  it('已读记录展示占位符', () => {
    const wrapper = mountTab({ events: [makeEvent({ status: 1 })] })
    expect(wrapper.text()).toContain('已读')
    expect(wrapper.find('.btn-stub').exists()).toBe(true)
  })

  it('空列表且非加载时展示空状态', () => {
    const wrapper = mountTab({ events: [], loading: false })
    expect(wrapper.find('.empty-stub').exists()).toBe(true)
  })

  it('加载中不展示空状态', () => {
    const wrapper = mountTab({ events: [], loading: true })
    expect(wrapper.find('.empty-stub').exists()).toBe(false)
  })
})

describe('DatasetAlertEventsTab 交互', () => {
  it('刷新按钮抛出 refresh', async () => {
    const wrapper = mountTab()

    await wrapper.findAll('.btn-stub')[0].trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('存在未读时可全部标记已读', async () => {
    const wrapper = mountTab({ events: [makeEvent()], unreadCount: 2 })
    const readAll = wrapper.findAll('.btn-stub').find((button) => button.text() === '全部标记已读')!

    await readAll.trigger('click')
    expect(wrapper.emitted('read-all')).toHaveLength(1)
  })

  it('无未读时全部已读按钮禁用', () => {
    const wrapper = mountTab({ events: [makeEvent({ status: 1 })], unreadCount: 0 })
    const readAll = wrapper.findAll('.btn-stub').find((button) => button.text() === '全部标记已读')!

    expect(readAll.attributes('disabled')).toBeDefined()
  })

  it('点击标记已读抛出 read-event', async () => {
    const wrapper = mountTab({ events: [makeEvent()] })
    const read = wrapper.findAll('.btn-stub').find((button) => button.text() === '标记已读')!

    await read.trigger('click')
    expect(wrapper.emitted('read-event')?.[0]?.[0]).toMatchObject({ id: 10 })
  })

  it('有记录时展示分页并可刷新', async () => {
    const wrapper = mountTab({ events: [makeEvent()], total: 25 })

    expect(wrapper.find('.pager-stub').exists()).toBe(true)
    await wrapper.find('.page-next').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('无记录时隐藏分页', () => {
    const wrapper = mountTab({ events: [], total: 0 })
    expect(wrapper.find('.pager-stub').exists()).toBe(false)
  })
})

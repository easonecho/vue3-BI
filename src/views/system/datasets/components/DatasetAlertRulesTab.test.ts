import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { AlertRule } from '@/api/alert'
import DatasetAlertRulesTab from './DatasetAlertRulesTab.vue'

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

const ElSwitchStub = defineComponent({
  name: 'ElSwitch',
  props: ['modelValue'],
  emits: ['update:modelValue', 'change'],
  template:
    '<div class="switch-stub" @click="$emit(\'update:modelValue\', !modelValue); $emit(\'change\', !modelValue)" />',
})

const ElPopconfirmStub = defineComponent({
  name: 'ElPopconfirm',
  emits: ['confirm'],
  template: `<div class="popconfirm-stub"><slot name="reference" /><button class="confirm-stub" @click="$emit('confirm')">确认</button></div>`,
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
    emits: ['click'],
    template: `<button class="btn-stub" @click="$emit('click')"><slot></slot></button>`,
  },
  'el-popconfirm': ElPopconfirmStub,
  'el-empty': { template: '<div class="empty-stub">暂无告警规则</div>' },
  'el-switch': ElSwitchStub,
  'el-icon': { template: '<span class="icon-stub"><slot /></span>' },
}

const directives = {
  loading: { mounted: () => {} },
}

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
    enabled: true,
    webhookUrl: null,
    lastRunAt: '2024-01-02T03:04:05.000Z',
    lastValue: 1200,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mountTab(props: { rules?: AlertRule[]; loading?: boolean } = {}) {
  currentRow = (props.rules?.[0] ?? {}) as Record<string, unknown>
  return mount(DatasetAlertRulesTab, {
    props: {
      rules: props.rules ?? [],
      loading: props.loading ?? false,
    },
    global: { stubs, directives },
  })
}

describe('DatasetAlertRulesTab 渲染', () => {
  it('展示规则名称、条件文案、周期与最近评估', () => {
    const wrapper = mountTab({ rules: [makeRule()] })
    const text = wrapper.text()

    expect(text).toContain('销售告警')
    expect(text).toContain('求和(amount) >= 1000')
    expect(text).toContain('0 9 * * *')
    expect(text).toContain('结果: 1200')
    expect(wrapper.find('.empty-stub').exists()).toBe(false)
  })

  it('规则未评估时展示「尚未评估」', () => {
    const wrapper = mountTab({ rules: [makeRule({ lastRunAt: null })] })
    expect(wrapper.text()).toContain('尚未评估')
  })

  it('空列表且非加载时展示空状态', () => {
    const wrapper = mountTab({ rules: [], loading: false })
    expect(wrapper.find('.empty-stub').exists()).toBe(true)
  })

  it('加载中不展示空状态', () => {
    const wrapper = mountTab({ rules: [], loading: true })
    expect(wrapper.find('.empty-stub').exists()).toBe(false)
  })
})

describe('DatasetAlertRulesTab 交互', () => {
  it('新增/刷新按钮抛出事件', async () => {
    const wrapper = mountTab()
    const buttons = wrapper.findAll('.btn-stub')

    await buttons.find((button) => button.text().includes('新增规则'))!.trigger('click')
    await buttons.find((button) => button.text() === '刷新')!.trigger('click')

    expect(wrapper.emitted('create')).toHaveLength(1)
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('立即执行/编辑/删除抛出对应规则', async () => {
    const wrapper = mountTab({ rules: [makeRule()] })
    const buttons = wrapper.findAll('.btn-stub')

    await buttons.find((button) => button.text() === '立即执行')!.trigger('click')
    await buttons.find((button) => button.text() === '编辑')!.trigger('click')
    await wrapper.find('.confirm-stub').trigger('click')

    expect(wrapper.emitted('run')?.[0]?.[0]).toMatchObject({ id: 3 })
    expect(wrapper.emitted('edit')?.[0]?.[0]).toMatchObject({ id: 3 })
    expect(wrapper.emitted('delete')?.[0]?.[0]).toMatchObject({ id: 3 })
  })

  it('切换启用状态时抛出 toggle-enabled', async () => {
    const wrapper = mountTab({ rules: [makeRule()] })

    await wrapper.find('.switch-stub').trigger('click')

    expect(wrapper.emitted('toggle-enabled')?.[0]?.[0]).toMatchObject({ id: 3, enabled: false })
  })
})

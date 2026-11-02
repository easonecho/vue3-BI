import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { AlertRule } from '@/api/alert'
import DatasetAlertRuleFormDialog from './DatasetAlertRuleFormDialog.vue'

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

const ElDialogStub = defineComponent({
  name: 'ElDialog',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue'],
  template: '<div class="dialog-stub" :data-title="title"><slot /><slot name="footer" /></div>',
})

const ElFormStub = defineComponent({
  name: 'ElForm',
  props: ['model', 'rules'],
  methods: {
    validate() {
      return Promise.resolve(true)
    },
  },
  template: '<form class="form-stub"><slot /></form>',
})

const ElInputStub = defineComponent({
  name: 'ElInput',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input class="input-stub" :value="modelValue" />',
})

const ElSelectStub = defineComponent({
  name: 'ElSelect',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="select-stub"><slot /></div>',
})

const stubs = {
  'el-dialog': ElDialogStub,
  'el-form': ElFormStub,
  'el-form-item': { template: '<div class="form-item-stub"><slot /></div>' },
  'el-input': ElInputStub,
  'el-select': ElSelectStub,
  'el-option': { template: '<div class="option-stub" />' },
  'el-input-number': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="number-stub" />',
  },
  'el-switch': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="switch-stub" />',
  },
  'el-button': {
    emits: ['click'],
    template: `<button class="btn-stub" @click="$emit('click')"><slot></slot></button>`,
  },
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
    enabled: false,
    webhookUrl: 'https://hook.example.com',
    lastRunAt: null,
    lastValue: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mountDialog(props: {
  modelValue?: boolean
  editing?: AlertRule | null
  fieldOptions?: string[]
  datasetId?: number | null
} = {}) {
  return mount(DatasetAlertRuleFormDialog, {
    props: {
      modelValue: props.modelValue ?? true,
      editing: props.editing ?? null,
      fieldOptions: props.fieldOptions ?? ['amount', 'region'],
      datasetId: props.datasetId ?? 12,
    },
    global: { stubs },
  })
}

function findButton(wrapper: ReturnType<typeof mountDialog>, text: string) {
  return wrapper.findAll('.btn-stub').find((button) => button.text() === text)
}

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue({})
  updateMock.mockResolvedValue({})
})

describe('DatasetAlertRuleFormDialog 初始化', () => {
  it('新增时展示新增标题与默认表单', () => {
    const wrapper = mountDialog()
    const inputs = wrapper.findAllComponents(ElInputStub)
    const selects = wrapper.findAllComponents(ElSelectStub)

    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('新增告警规则')
    expect(inputs[0].props('modelValue')).toBe('')
    expect(selects[0].props('modelValue')).toBe('count')
    expect(selects[1].props('modelValue')).toBe('gt')
    expect(wrapper.findAll('.form-item-stub')).toHaveLength(6)
  })

  it('编辑时回填规则并展示编辑标题', async () => {
    const wrapper = mountDialog({ modelValue: false, editing: makeRule() })

    await wrapper.setProps({ modelValue: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('编辑告警规则')
    expect(wrapper.findAllComponents(ElInputStub)[0].props('modelValue')).toBe('销售告警')
  })

  it('非 count 聚合时展示字段选择器', async () => {
    const wrapper = mountDialog()
    const selects = wrapper.findAllComponents(ElSelectStub)

    selects[0].vm.$emit('update:modelValue', 'sum')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAllComponents(ElSelectStub)).toHaveLength(4)
  })
})

describe('DatasetAlertRuleFormDialog 保存', () => {
  it('保存成功后关闭弹窗并抛出 saved', async () => {
    const wrapper = mountDialog()
    wrapper.findAllComponents(ElInputStub)[0].vm.$emit('update:modelValue', '  新告警  ')
    await wrapper.vm.$nextTick()

    await findButton(wrapper, '保存')!.trigger('click')
    await Promise.resolve()

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: '新告警', datasetId: 12 }),
    )
    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('保存失败时不关闭也不抛出 saved', async () => {
    createMock.mockRejectedValueOnce(new Error('保存失败'))
    const wrapper = mountDialog()

    await findButton(wrapper, '保存')!.trigger('click')
    await Promise.resolve()
    await Promise.resolve()

    expect(wrapper.emitted('saved')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('取消按钮关闭弹窗', async () => {
    const wrapper = mountDialog()

    await findButton(wrapper, '取消')!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})

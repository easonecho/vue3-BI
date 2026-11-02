import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { DashboardGroup } from '@/api/types'
import DashboardCreateInfoForm from './DashboardCreateInfoForm.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const ElInputStub = defineComponent({
  name: 'ElInput',
  props: ['modelValue', 'type', 'rows'],
  emits: ['update:modelValue', 'keyup'],
  template: `<input
    class="input-stub"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    @keyup="$emit('keyup', $event)"
  />`,
})

const ElSelectStub = defineComponent({
  name: 'ElSelect',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="select-stub"><slot /></div>',
})

const ElSwitchStub = defineComponent({
  name: 'ElSwitch',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="switch-stub" />',
})

const stubs = {
  'el-form': { template: '<form class="form-stub"><slot /></form>' },
  'el-form-item': {
    props: ['label'],
    template: '<div class="form-item-stub" :data-label="label"><slot /></div>',
  },
  'el-input': ElInputStub,
  'el-select': ElSelectStub,
  'el-option': { template: '<div class="option-stub" />' },
  'el-switch': ElSwitchStub,
}

const groups: DashboardGroup[] = [
  { id: 1, name: '默认分组', sort: 0, creatorId: 1, createdAt: '', updatedAt: '' },
  { id: 2, name: '销售分组', sort: 1, creatorId: 1, createdAt: '', updatedAt: '' },
]

function mountForm() {
  return mount(DashboardCreateInfoForm, {
    props: {
      name: '看板名称',
      description: '描述内容',
      groupId: 1,
      isPublic: false,
      groups,
    },
    global: { stubs },
  })
}

describe('DashboardCreateInfoForm 表单渲染', () => {
  it('按字段渲染标签与分组选项', () => {
    const wrapper = mountForm()
    const labels = wrapper.findAll('.form-item-stub').map((item) => item.attributes('data-label'))

    expect(labels).toEqual([
      'dashboard.name',
      'dashboard.description',
      'dashboard.group',
      'dashboard.isPublic',
    ])
    expect(wrapper.findAll('.option-stub')).toHaveLength(2)
    expect(wrapper.find('.form-hint').text()).toBe('dashboard.publicHint')
  })
})

describe('DashboardCreateInfoForm 双向绑定', () => {
  it('名称与描述输入抛出对应 update 事件', async () => {
    const wrapper = mountForm()
    const inputs = wrapper.findAllComponents(ElInputStub)

    inputs[0].vm.$emit('update:modelValue', '新名称')
    inputs[1].vm.$emit('update:modelValue', '新描述')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:name')?.[0]).toEqual(['新名称'])
    expect(wrapper.emitted('update:description')?.[0]).toEqual(['新描述'])
  })

  it('分组与公开开关抛出对应 update 事件', () => {
    const wrapper = mountForm()

    wrapper.findComponent(ElSelectStub).vm.$emit('update:modelValue', 2)
    wrapper.findComponent(ElSwitchStub).vm.$emit('update:modelValue', true)

    expect(wrapper.emitted('update:groupId')?.[0]).toEqual([2])
    expect(wrapper.emitted('update:isPublic')?.[0]).toEqual([true])
  })

  it('名称输入框回车触发 submit', async () => {
    const wrapper = mountForm()

    await wrapper.find('.input-stub').trigger('keyup', { key: 'Enter' })
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })
})

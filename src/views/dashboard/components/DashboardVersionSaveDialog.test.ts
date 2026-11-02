import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import DashboardVersionSaveDialog from './DashboardVersionSaveDialog.vue'

const ElInputStub = defineComponent({
  name: 'ElInput',
  props: ['modelValue', 'type', 'rows'],
  emits: ['update:modelValue'],
  template: '<input class="input-stub" :value="modelValue" />',
})

const ElDialogStub = defineComponent({
  name: 'ElDialog',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue'],
  template: '<div class="dialog-stub" :data-title="title"><slot /><slot name="footer" /></div>',
})

const stubs = {
  'el-dialog': ElDialogStub,
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<div class="form-item-stub"><slot /></div>' },
  'el-input': ElInputStub,
  'el-button': {
    emits: ['click'],
    template: `<button class="btn-stub" @click="$emit('click')"><slot /></button>`,
  },
}

function mountDialog(saving = false) {
  return mount(DashboardVersionSaveDialog, {
    props: { saving, modelValue: true, remark: '改版前' },
    global: { stubs },
  })
}

describe('DashboardVersionSaveDialog', () => {
  it('展示标题与备注内容', () => {
    const wrapper = mountDialog()

    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('保存版本快照')
    expect(wrapper.findComponent(ElInputStub).props('modelValue')).toBe('改版前')
  })

  it('备注输入抛出 update:remark', () => {
    const wrapper = mountDialog()

    wrapper.findComponent(ElInputStub).vm.$emit('update:modelValue', '新备注')

    expect(wrapper.emitted('update:remark')?.[0]).toEqual(['新备注'])
  })

  it('保存按钮抛出 save，取消按钮关闭弹窗', async () => {
    const wrapper = mountDialog()
    const buttons = wrapper.findAll('.btn-stub')
    const cancel = buttons.find((button) => button.text() === '取消')!
    const save = buttons.find((button) => button.text() === '保存')!

    await save.trigger('click')
    expect(wrapper.emitted('save')).toHaveLength(1)

    await cancel.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})

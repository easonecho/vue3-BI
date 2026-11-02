import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardRenameDialog from './DashboardRenameDialog.vue'

const stubs = {
  'el-dialog': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="dialog-stub"><slot /><slot name="footer" /></div>',
  },
  'el-input': {
    name: 'ElInput',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="input-stub" />',
  },
  'el-button': {
    props: ['type', 'loading'],
    template: '<button class="btn-stub"><slot /></button>',
  },
}

function mountDialog() {
  return mount(DashboardRenameDialog, {
    props: { modelValue: true, name: '旧名称', loading: false },
    global: { stubs },
  })
}

describe('DashboardRenameDialog', () => {
  it('点击确定抛出 confirm 事件', () => {
    const wrapper = mountDialog()
    const buttons = wrapper.findAll('.btn-stub')

    buttons[1].trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('点击取消关闭对话框', () => {
    const wrapper = mountDialog()
    const buttons = wrapper.findAll('.btn-stub')

    buttons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('输入名称抛出 update:name 事件', () => {
    const wrapper = mountDialog()
    wrapper.findComponent({ name: 'ElInput' }).vm.$emit('update:modelValue', '新名称')

    expect(wrapper.emitted('update:name')?.[0]).toEqual(['新名称'])
  })
})

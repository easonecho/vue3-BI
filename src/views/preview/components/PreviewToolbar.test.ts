import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import PreviewToolbar from './PreviewToolbar.vue'

const ElButtonStub = defineComponent({
  name: 'ElButton',
  emits: ['click'],
  template: `<button v-bind="$attrs" @click="$emit('click', $event)"><slot /></button>`,
})

const stubs = {
  'el-button': ElButtonStub,
  'el-icon': { template: '<span class="icon-stub"><slot /></span>' },
  'el-tooltip': { template: '<span><slot /></span>' },
  'el-dropdown': { template: '<div><slot /></div>' },
  'el-dropdown-menu': { template: '<div><slot /></div>' },
  'el-dropdown-item': { template: '<div><slot /></div>' },
  'el-divider': { template: '<span class="divider-stub" />' },
  'el-select': { template: '<div class="select-stub"><slot /></div>' },
  'el-option': { template: '<div class="option-stub" />' },
}

function mountToolbar(overrides: { pureMode?: boolean; isFullscreen?: boolean } = {}) {
  return mount(PreviewToolbar, {
    props: {
      dashboardName: '销售大屏',
      lastRefreshAt: new Date('2026-01-01T08:00:00'),
      refreshing: false,
      pureMode: overrides.pureMode ?? false,
      isFullscreen: overrides.isFullscreen ?? false,
      autoRefreshInterval: 0,
      exporting: false,
    },
    global: { stubs },
  })
}

describe('PreviewToolbar 可访问性', () => {
  it('图标按钮均提供可访问名称', () => {
    const wrapper = mountToolbar()

    expect(wrapper.find('button[aria-label="刷新 (R)"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="纯净模式 (H)"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="全屏 (F)"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="导出"]').exists()).toBe(true)
  })

  it('状态切换时按钮名称同步更新', () => {
    const wrapper = mountToolbar({ pureMode: true, isFullscreen: true })

    expect(wrapper.find('button[aria-label="显示工具栏 (H)"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="退出全屏 (F/Esc)"]').exists()).toBe(true)
  })

  it('点击刷新按钮触发 refresh 事件', async () => {
    const wrapper = mountToolbar()

    await wrapper.find('button[aria-label="刷新 (R)"]').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })
})

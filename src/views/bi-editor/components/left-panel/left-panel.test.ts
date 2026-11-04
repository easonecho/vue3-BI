import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LeftPanel from '../LeftPanel.vue'
import ComponentLibraryTab from './ComponentLibraryTab.vue'
import LayerListTab from './LayerListTab.vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import type { ComponentMeta } from '@/views/bi-editor/types'

/**
 * 🔑 轻量桩：只保留插槽 / 输入事件等最小行为，
 *   避免引入整套 Element Plus 与 ECharts 渲染组件拖慢测试。
 */
const slotStub = { template: '<div><slot /></div>' }

const stubs = {
  // 🔑 组件预览会真实渲染图表，测试只关心结构，直接桩掉
  ComponentRenderer: { name: 'ComponentRenderer', template: '<div class="renderer-stub" />' },
  ContextMenu: { name: 'ContextMenu', template: '<div class="context-menu-stub" />' },
  'el-tabs': { template: '<div class="tabs-stub"><slot /></div>' },
  'el-tab-pane': { template: '<div class="tab-pane-stub"><slot /></div>' },
  // 🔑 暴露 modelValue 长度，用于断言 collapsed 切换会收起所有分类
  'el-collapse': {
    props: ['modelValue'],
    template:
      '<div class="collapse-stub" :data-groups="modelValue ? modelValue.length : 0"><slot /></div>',
  },
  'el-collapse-item': {
    props: ['name'],
    template: '<div class="collapse-item-stub"><slot name="title" /><slot /></div>',
  },
  'el-input': {
    props: ['modelValue'],
    emits: ['update:modelValue', 'blur'],
    template:
      '<input class="input-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'blur\', $event)" />',
  },
  'el-tooltip': slotStub,
  'el-icon': slotStub,
  'el-empty': {
    props: ['description'],
    template: '<div class="empty-stub">{{ description }}</div>',
  },
}

let pinia: ReturnType<typeof createPinia>

function mountWith(comp: unknown, props: Record<string, unknown> = {}) {
  return mount(comp as never, { props: props as never, global: { plugins: [pinia], stubs } })
}

function addTwoComponents() {
  const store = useBiEditorStore()
  store.addComponent('line-chart', 0, 0)
  store.addComponent('bar-chart', 10, 10)
  return store
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

describe('ComponentLibraryTab', () => {
  it('按分类渲染组件卡片，点击卡片对外 emit add-component', async () => {
    const wrapper = mountWith(ComponentLibraryTab, { collapsed: false })
    const items = wrapper.findAll('.component-item')
    expect(items.length).toBeGreaterThan(0)

    await items[0].trigger('click')
    const events = wrapper.emitted('add-component')
    expect(events).toHaveLength(1)
    const firstComponent = events?.[0]?.[0] as ComponentMeta | undefined
    expect(firstComponent?.type).toBeTruthy()
  })

  it('拖拽卡片会写入 dataTransfer 并对外 emit drag-start', async () => {
    const wrapper = mountWith(ComponentLibraryTab, { collapsed: false })
    const setData = vi.fn()
    await wrapper.findAll('.component-item')[0].trigger('dragstart', {
      dataTransfer: { setData, effectAllowed: '' },
    })
    expect(setData).toHaveBeenCalledWith('application/json', expect.any(String))
    expect(wrapper.emitted('drag-start')).toHaveLength(1)
  })

  it('collapsed 变为 true 时收起所有分类，恢复后重新展开', async () => {
    // 🔑 需要 setProps，直接 mount 以保留组件 props 类型
    const wrapper = mount(ComponentLibraryTab, {
      props: { collapsed: false },
      global: { plugins: [pinia], stubs },
    })
    const groupsOf = () => Number(wrapper.find('.collapse-stub').attributes('data-groups'))
    expect(groupsOf()).toBeGreaterThan(0)

    await wrapper.setProps({ collapsed: true })
    expect(groupsOf()).toBe(0)

    await wrapper.setProps({ collapsed: false })
    expect(groupsOf()).toBeGreaterThan(0)
  })
})

describe('LayerListTab', () => {
  it('搜索框按名称过滤图层列表', async () => {
    addTwoComponents()
    const wrapper = mountWith(LayerListTab)
    expect(wrapper.findAll('.layer-item')).toHaveLength(2)

    await wrapper.find('.layer-toolbar .input-stub').setValue('柱')
    expect(wrapper.findAll('.layer-item')).toHaveLength(1)
    expect(wrapper.find('.layer-toolbar__count').text()).toContain('1 / 2')
  })

  it('点击图层切换选中（保持层级顺序）', async () => {
    const store = addTwoComponents()
    const wrapper = mountWith(LayerListTab)
    const ids = store.layerList.map((l) => l.id)

    await wrapper.findAll('.layer-item')[1].trigger('click')
    expect(store.selectedId).toBe(ids[1])
    expect(store.selectedIds).toEqual([ids[1]])
  })

  it('双击图层进入重命名，失焦后提交新名称', async () => {
    const store = addTwoComponents()
    const wrapper = mountWith(LayerListTab)
    const target = store.layerList[0]

    await wrapper.findAll('.layer-item')[0].trigger('dblclick')
    const input = wrapper.find('.layer-name-input')
    expect(input.exists()).toBe(true)

    await input.setValue('新名字')
    await input.trigger('blur')
    expect(store.getComponent(target.id)?.name).toBe('新名字')
  })

  it('无组件时显示空状态', () => {
    const wrapper = mountWith(LayerListTab)
    expect(wrapper.find('.empty-stub').text()).toContain('暂无图层')
  })
})

describe('LeftPanel 组合根', () => {
  it('渲染组件库/图层两个 Tab，并转发子组件事件', async () => {
    const wrapper = mountWith(LeftPanel)
    expect(wrapper.findAll('.tab-pane-stub')).toHaveLength(2)

    const meta = { type: 'line-chart' } as ComponentMeta
    wrapper.findComponent(ComponentLibraryTab).vm.$emit('add-component', meta)
    expect(wrapper.emitted('add-component')?.[0]).toEqual([meta])
  })

  it('折叠拉手切换面板收起状态', async () => {
    const wrapper = mountWith(LeftPanel)
    expect(wrapper.classes()).not.toContain('collapsed')

    await wrapper.find('.sidebar-handle').trigger('click')
    expect(wrapper.classes()).toContain('collapsed')
  })
})

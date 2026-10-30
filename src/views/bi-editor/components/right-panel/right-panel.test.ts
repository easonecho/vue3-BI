import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PropsTab from './PropsTab.vue'
import StyleTab from './StyleTab.vue'
import CanvasTab from './CanvasTab.vue'
import { useBiEditorStore } from '@/stores/bi-editor'

/** 🔑 Monaco 体积过大且与本测试无关，直接替换为无渲染组件 */
vi.mock('@/components/MonacoEditor.vue', () => ({
  default: { name: 'MonacoEditor', render: () => null },
}))

/**
 * 🔑 Element Plus 组件桩：只保留「渲染默认插槽 / 具名插槽 / description」的最小行为，
 *   既避免引入整套 UI 库拖慢测试，又能真实断言拆分后的模板结构。
 */
const slotStub = { template: '<div><slot name="title" /><slot /></div>' }

const stubs = {
  'el-collapse': slotStub,
  'el-collapse-item': slotStub,
  'el-button': slotStub,
  'el-upload': slotStub,
  'el-tooltip': slotStub,
  'el-icon': slotStub,
  'el-dialog': {
    template: '<div class="dialog-stub"><slot name="header" /><slot /><slot name="footer" /></div>',
  },
  'el-empty': {
    props: ['description'],
    template: '<div class="empty-stub">{{ description }}</div>',
  },
  'el-input': { template: '<div class="input-stub" />' },
  'el-input-number': { template: '<div class="input-number-stub" />' },
  'el-color-picker': { template: '<div class="color-picker-stub" />' },
  'el-checkbox': slotStub,
  'el-switch': { template: '<div class="switch-stub" />' },
  'el-slider': { template: '<div class="slider-stub" />' },
  'el-table': slotStub,
  // 🔑 表格单元格插槽在真实 ElTableColumn 中会收到 $index，桩需补上该参数
  'el-table-column': { template: '<div><slot :$index="0" /></div>' },
}

let pinia: ReturnType<typeof createPinia>

function mountTab<T>(comp: T) {
  return mount(comp as never, { global: { plugins: [pinia], stubs } })
}

/** 构造一个已选中的单组件编辑器状态 */
function setupSingleSelection() {
  const store = useBiEditorStore()
  store.addComponent('line-chart', 0, 0)
  return store
}

/** 构造多选（无主选）状态 */
function setupMultiSelection() {
  const store = useBiEditorStore()
  store.addComponent('line-chart', 0, 0)
  store.addComponent('bar-chart', 10, 10)
  const [a, b] = store.components.map((c) => c.id)
  store.selectedId = null
  store.selectedIds = [a, b]
  return store
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

describe('PropsTab 单组件属性', () => {
  it('未选中组件时显示空状态', () => {
    const wrapper = mountTab(PropsTab)
    expect(wrapper.find('.props-section').exists()).toBe(false)
    expect(wrapper.text()).toContain('请选择组件查看属性')
  })

  it('选中组件后渲染内置折叠项与 Schema 分组', () => {
    setupSingleSelection()
    const wrapper = mountTab(PropsTab)

    expect(wrapper.find('.props-section').exists()).toBe(true)
    const titles = wrapper.findAll('.collapse-title').map((t) => t.text())
    // 内置固定分组
    for (const name of ['基础', '位置 & 尺寸', '代码配置', '层级', '分组', '对齐 & 分布', '状态']) {
      expect(titles).toContain(name)
    }
    // Schema 驱动分组（line-chart 至少有一个 group）
    expect(titles.length).toBeGreaterThan(7)
    // 代码配置 / 分组 / 对齐 各自复用独立组件
    expect(wrapper.find('.code-config-actions').exists()).toBe(true)
    expect(wrapper.find('.group-actions').exists()).toBe(true)
    expect(wrapper.findAll('.align-row').length).toBe(3)
  })

  it('代码配置提供编辑/导出/导入三个入口与字段白名单提示', () => {
    setupSingleSelection()
    const wrapper = mountTab(PropsTab)

    const actionsText = wrapper.find('.code-config-actions').text()
    expect(actionsText).toContain('编辑配置')
    expect(actionsText).toContain('导出')
    expect(actionsText).toContain('导入')

    // 弹窗虽未打开，但白名单提示已在模板中（el-dialog 桩会渲染插槽）
    expect(wrapper.text()).toContain('props, style, dataSource, dataConfig')
  })
})

describe('PropsTab 多选批量面板', () => {
  it('多个组件选中且无主选时显示批量面板', () => {
    setupMultiSelection()
    const wrapper = mountTab(PropsTab)

    expect(wrapper.find('.multi-edit').exists()).toBe(true)
    expect(wrapper.find('.multi-summary').text()).toContain('2')
    // 批量对齐复用同一套对齐控件；分组控件只出现一次
    expect(wrapper.findAll('.align-row').length).toBe(3)
    expect(wrapper.findAll('.group-actions').length).toBe(1)
    expect(wrapper.text()).toContain('批量样式')
  })
})

describe('StyleTab', () => {
  it('未选中时显示空状态', () => {
    const wrapper = mountTab(StyleTab)
    expect(wrapper.text()).toContain('请选择组件查看样式')
  })

  it('选中后渲染背景色与圆角字段', () => {
    setupSingleSelection()
    const wrapper = mountTab(StyleTab)
    expect(wrapper.find('.style-section').exists()).toBe(true)
    expect(wrapper.text()).toContain('外观')
    expect(wrapper.text()).toContain('背景色')
    expect(wrapper.text()).toContain('边框圆角')
  })
})

describe('CanvasTab', () => {
  it('渲染画布尺寸、预设与视图开关', () => {
    const wrapper = mountTab(CanvasTab)
    expect(wrapper.find('.canvas-settings').exists()).toBe(true)
    expect(wrapper.findAll('.cs-preset').length).toBe(6)
    expect(wrapper.text()).toContain('1920×1080')
    expect(wrapper.text()).toContain('显示标尺')
    expect(wrapper.text()).toContain('网格大小')
  })

  it('点击预设会更新画布尺寸', async () => {
    const store = useBiEditorStore()
    const wrapper = mountTab(CanvasTab)

    await wrapper.findAll('.cs-preset')[0].trigger('click')
    expect(store.canvas.width).toBe(1920)
    expect(store.canvas.height).toBe(1080)
  })
})

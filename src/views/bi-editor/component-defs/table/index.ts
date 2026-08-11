import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const tableDefinition: ComponentDefinition = {
  type: 'table',
  meta: { name: '表格', category: 'data', icon: 'Grid', defaultWidth: 500, defaultHeight: 240 },
  widget: Widget,
  propsSchema: [
    { key: 'border', label: '显示边框', type: 'switch', default: true, group: '外观' },
    { key: 'stripe', label: '斑马纹', type: 'switch', default: true, group: '外观' },
    { key: 'showHeader', label: '显示表头', type: 'switch', default: true, group: '外观' },
    { key: 'round', label: '圆角', type: 'switch', default: false, group: '外观' },
    { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 20, default: 12, group: '外观' },
    { key: 'headerBg', label: '表头背景', type: 'colorpicker', default: '#f9fafb', group: '表头' },
    { key: 'headerColor', label: '表头文字', type: 'colorpicker', default: '#374151', group: '表头' },
    { key: 'color', label: '单元格文字', type: 'colorpicker', default: '#374151', group: '外观' },
  ],
  extraDefaults: {
    columns: [
      { key: 'name', title: '名称', width: 120 },
      { key: 'value', title: '数值', width: 100, align: 'right' },
      { key: 'ratio', title: '占比', width: 100, align: 'right' },
    ],
    data: [
      { name: '指标 A', value: 1280, ratio: '32%' },
      { name: '指标 B', value: 960, ratio: '24%' },
      { name: '指标 C', value: 720, ratio: '18%' },
      { name: '指标 D', value: 540, ratio: '14%' },
      { name: '指标 E', value: 480, ratio: '12%' },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default tableDefinition

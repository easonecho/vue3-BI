import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const progressDefinition: ComponentDefinition = {
  type: 'progress',
  meta: { name: '进度条', category: 'info', icon: 'Loading', defaultWidth: 300, defaultHeight: 20 },
  widget: Widget,
  propsSchema: [
    { key: 'value', label: '进度', type: 'slider', min: 0, max: 100, default: 0 },
    { key: 'max', label: '最大值', type: 'number', default: 100 },
    { key: 'color', label: '颜色', type: 'colorpicker', default: '#409EFF' },
    { key: 'showText', label: '显示文字', type: 'switch', default: true },
  ],
  defaultStyle: {},
}

export default progressDefinition

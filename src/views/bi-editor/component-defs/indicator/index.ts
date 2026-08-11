import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const indicatorDefinition: ComponentDefinition = {
  type: 'indicator',
  meta: { name: '指标卡', category: 'info', icon: 'Flag', defaultWidth: 200, defaultHeight: 100 },
  widget: Widget,
  propsSchema: [
    { key: 'title', label: '标题', type: 'input', default: '指标' },
    { key: 'value', label: '数值', type: 'number', default: 0 },
    { key: 'unit', label: '单位', type: 'input', default: '' },
    { key: 'fontSize', label: '数值字号', type: 'slider', min: 16, max: 64, default: 32, group: '字体' },
    { key: 'color', label: '数值颜色', type: 'colorpicker', default: '#333333', group: '字体' },
  ],
  defaultStyle: {},
}

export default indicatorDefinition

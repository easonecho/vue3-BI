import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const numberDefinition: ComponentDefinition = {
  type: 'number',
  meta: { name: '数字', category: 'info', icon: 'Odometer', defaultWidth: 100, defaultHeight: 60 },
  widget: Widget,
  propsSchema: [
    { key: 'value', label: '数值', type: 'number', default: 0 },
    { key: 'prefix', label: '前缀', type: 'input', default: '' },
    { key: 'suffix', label: '后缀', type: 'input', default: '' },
    { key: 'fontSize', label: '字号', type: 'slider', min: 14, max: 72, default: 24, group: '字体' },
    { key: 'color', label: '颜色', type: 'colorpicker', default: '#333333', group: '字体' },
    {
      key: 'fontWeight',
      label: '字重',
      type: 'select',
      options: [
        { label: '常规', value: 'normal' },
        { label: '粗体', value: 'bold' },
      ],
      default: 'bold',
      group: '字体',
    },
  ],
  defaultStyle: {},
}

export default numberDefinition

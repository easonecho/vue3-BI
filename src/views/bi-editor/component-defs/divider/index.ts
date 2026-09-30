import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const dividerDefinition: ComponentDefinition = {
  type: 'divider',
  meta: {
    name: '分割线',
    category: 'basic',
    icon: 'Minus',
    defaultWidth: 300,
    defaultHeight: 24,
  },
  widget: Widget,
  propsSchema: [
    { key: 'text', label: '中间文案', type: 'input', default: '', group: '内容' },
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
      ],
      default: 'horizontal',
      group: '样式',
    },
    {
      key: 'borderStyle',
      label: '线条样式',
      type: 'select',
      options: [
        { label: '实线', value: 'solid' },
        { label: '虚线', value: 'dashed' },
        { label: '点线', value: 'dotted' },
        { label: '双线', value: 'double' },
      ],
      default: 'solid',
      group: '样式',
    },
    {
      key: 'contentPosition',
      label: '文案位置',
      type: 'select',
      options: [
        { label: '左', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右', value: 'right' },
      ],
      default: 'center',
      group: '样式',
    },
    { key: 'color', label: '颜色', type: 'colorpicker', default: '#dcdfe6', group: '样式' },
    { key: 'thickness', label: '粗细', type: 'number', min: 1, max: 10, default: 1, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default dividerDefinition

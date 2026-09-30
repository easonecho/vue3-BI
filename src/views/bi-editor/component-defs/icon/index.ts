import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const iconDefinition: ComponentDefinition = {
  type: 'icon',
  meta: {
    name: '图标',
    category: 'basic',
    icon: 'Star',
    defaultWidth: 80,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'iconName',
      label: '图标名',
      type: 'input',
      default: 'Star',
      group: '内容',
      tip: 'Element Plus 图标名（如 Star、Bell、Setting）',
    },
    { key: 'size', label: '大小', type: 'number', min: 12, max: 200, default: 32, group: '样式' },
    { key: 'color', label: '颜色', type: 'colorpicker', default: '#606266', group: '样式' },
    { key: 'rotate', label: '旋转角度', type: 'number', min: 0, max: 360, default: 0, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default iconDefinition

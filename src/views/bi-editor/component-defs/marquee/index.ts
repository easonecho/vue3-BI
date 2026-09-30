import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const marqueeDefinition: ComponentDefinition = {
  type: 'marquee',
  meta: {
    name: '跑马灯',
    category: 'info',
    icon: 'Notification',
    defaultWidth: 400,
    defaultHeight: 40,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'content',
      label: '内容',
      type: 'textarea',
      default: '欢迎使用 BI 编辑器，这是一个跑马灯组件示例',
      group: '内容',
    },
    {
      key: 'speed',
      label: '速度 (px/s)',
      type: 'slider',
      min: 10,
      max: 200,
      default: 60,
      group: '样式',
    },
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      options: [
        { label: '向左', value: 'left' },
        { label: '向右', value: 'right' },
      ],
      default: 'left',
      group: '样式',
    },
    { key: 'pauseOnHover', label: '悬停暂停', type: 'switch', default: true, group: '样式' },
    { key: 'fontSize', label: '字号', type: 'number', min: 12, max: 48, default: 16, group: '样式' },
    { key: 'color', label: '文字颜色', type: 'colorpicker', default: '#1f2937', group: '样式' },
    { key: 'bgColor', label: '背景色', type: 'colorpicker', default: 'transparent', group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default marqueeDefinition

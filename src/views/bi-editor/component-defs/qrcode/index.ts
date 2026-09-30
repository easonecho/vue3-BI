import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const qrcodeDefinition: ComponentDefinition = {
  type: 'qrcode',
  meta: {
    name: '二维码',
    category: 'basic',
    icon: 'Connection',
    defaultWidth: 160,
    defaultHeight: 160,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'content',
      label: '内容',
      type: 'textarea',
      default: 'https://trae.com',
      group: '内容',
    },
    { key: 'size', label: '尺寸', type: 'number', min: 80, max: 400, default: 160, group: '样式' },
    { key: 'fgColor', label: '前景色', type: 'colorpicker', default: '#000000', group: '样式' },
    { key: 'bgColor', label: '背景色', type: 'colorpicker', default: '#ffffff', group: '样式' },
    { key: 'margin', label: '边距', type: 'number', min: 0, max: 20, default: 2, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default qrcodeDefinition

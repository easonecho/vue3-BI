import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const rectDefinition: ComponentDefinition = {
  type: 'rect',
  meta: {
    name: '矩形',
    category: 'basic',
    icon: 'FullScreen',
    defaultWidth: 100,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    { key: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 50, default: 0 },
    { key: 'borderWidth', label: '边框宽度', type: 'slider', min: 0, max: 10, default: 0 },
    { key: 'borderColor', label: '边框颜色', type: 'colorpicker', default: '#333333' },
  ],
  defaultStyle: { backgroundColor: '#E5E7EB' },
}

export default rectDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'

export const rectDefinition: ComponentDefinition = {
  type: 'rect',
  meta: {
    name: '矩形',
    category: 'basic',
    icon: 'FullScreen',
    defaultWidth: 100,
    defaultHeight: 80,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    { key: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 50, default: 0 },
    { key: 'borderWidth', label: '边框宽度', type: 'slider', min: 0, max: 10, default: 0 },
    { key: 'borderColor', label: '边框颜色', type: 'colorpicker', default: '#333333' },
  ],
  defaultStyle: { backgroundColor: '#E5E7EB' },
}

export default rectDefinition

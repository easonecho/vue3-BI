import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'

export const lineDefinition: ComponentDefinition = {
  type: 'line',
  meta: {
    name: '直线',
    category: 'basic',
    icon: 'Minus',
    defaultWidth: 200,
    defaultHeight: 2,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      options: ['horizontal', 'vertical'],
      default: 'horizontal',
    },
    { key: 'thickness', label: '粗细', type: 'slider', min: 1, max: 20, default: 2 },
    { key: 'color', label: '颜色', type: 'colorpicker', default: '#999999' },
  ],
  defaultStyle: {},
}

export default lineDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

export const barChartDefinition: ComponentDefinition = {
  type: 'bar-chart',
  meta: {
    name: '柱状图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'barWidth', label: '柱宽', type: 'slider', min: 5, max: 50, default: 20, group: '样式' },
    { key: 'barGap', label: '柱间距', type: 'slider', min: 0, max: 100, default: 30, group: '样式' },
    { key: 'stack', label: '堆叠', type: 'switch', default: false, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: true,
}

export default barChartDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

export const scatterChartDefinition: ComponentDefinition = {
  type: 'scatter-chart',
  meta: {
    name: '散点图',
    category: 'chart',
    icon: 'DataPoint',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'symbolSize', label: '点大小', type: 'slider', min: 2, max: 30, default: 10, group: '样式' },
    { key: 'showLabel', label: '显示标签', type: 'switch', default: false, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: true,
}

export default scatterChartDefinition

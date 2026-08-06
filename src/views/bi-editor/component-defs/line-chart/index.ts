import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

export const lineChartDefinition: ComponentDefinition = {
  type: 'line-chart',
  meta: {
    name: '折线图',
    category: 'chart',
    icon: 'TrendCharts',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'smooth', label: '平滑曲线', type: 'switch', default: true, group: '样式' },
    { key: 'area', label: '面积填充', type: 'switch', default: false, group: '样式' },
    { key: 'pointSize', label: '点大小', type: 'slider', min: 0, max: 20, default: 6, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: true,
}

export default lineChartDefinition

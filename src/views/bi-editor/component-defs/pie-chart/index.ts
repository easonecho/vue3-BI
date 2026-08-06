import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

export const pieChartDefinition: ComponentDefinition = {
  type: 'pie-chart',
  meta: {
    name: '饼图',
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 300,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'radius', label: '半径', type: 'slider', min: 20, max: 80, default: 55, group: '样式' },
    { key: 'rose', label: '玫瑰图', type: 'switch', default: false, group: '样式' },
    { key: 'donut', label: '环形图', type: 'switch', default: false, group: '样式' },
    {
      key: 'innerRadius',
      label: '内圆半径',
      type: 'slider',
      min: 10,
      max: 70,
      default: 35,
      group: '样式',
      visibleWhen: { field: 'donut', truthy: true },
    },
  ],
  defaultStyle: {},
  supportsDataBinding: true,
}

export default pieChartDefinition

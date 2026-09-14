import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

/** 平行坐标图默认数据：维度定义 + 多条数据线 */
export const PARALLEL_DEFAULT_DIMENSIONS = [
  { name: 'CPU', max: 100 },
  { name: '内存', max: 100 },
  { name: '磁盘', max: 100 },
  { name: '网络', max: 100 },
  { name: 'QPS', max: 1000 },
]
export const PARALLEL_DEFAULT_DATA = [
  [60, 45, 80, 30, 500],
  [80, 60, 70, 40, 800],
  [70, 55, 75, 35, 650],
  [90, 70, 85, 45, 900],
  [55, 40, 60, 25, 400],
  [75, 65, 80, 50, 750],
]

export const parallelChartDefinition: ComponentDefinition = {
  type: 'parallel-chart',
  meta: {
    name: '平行坐标图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 500,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'lineColor',
      label: '线条颜色',
      type: 'colorpicker',
      default: '#22d3ee',
      group: '样式',
      tip: '线条颜色',
    },
    {
      key: 'lineOpacity',
      label: '线条透明度',
      type: 'slider',
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.5,
      group: '样式',
      tip: '线条透明度',
    },
    {
      key: 'lineWidth',
      label: '线条宽度',
      type: 'slider',
      min: 1,
      max: 5,
      default: 1.5,
      group: '样式',
      tip: '线条宽度',
    },
    {
      key: 'axisColor',
      label: '平行坐标轴颜色',
      type: 'colorpicker',
      default: '#475569',
      group: '坐标',
      tip: '平行坐标轴颜色',
    },
    {
      key: 'labelColor',
      label: '标签颜色',
      type: 'colorpicker',
      default: '#e2e8f0',
      group: '标签',
    },
  ],
  extraDefaults: {
    dimensions: PARALLEL_DEFAULT_DIMENSIONS,
    data: PARALLEL_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default parallelChartDefinition

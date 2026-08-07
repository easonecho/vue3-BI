import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns } from '../types'

/** 🔑 散点图默认真实数据：每个系列是 {name, data: [[x,y], ...]} */
export const SCATTER_DEFAULT_CATEGORIES = null as unknown as string[] | null
export const SCATTER_DEFAULT_SERIES = [
  {
    name: '男',
    data: [
      [160, 52],
      [165, 55],
      [170, 60],
      [175, 65],
      [180, 70],
    ],
  },
  {
    name: '女',
    data: [
      [155, 45],
      [160, 50],
      [165, 53],
      [170, 58],
      [175, 62],
    ],
  },
]

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
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据系列名称单独配置颜色、点大小、是否显示标签等（按名称匹配）',
      // 🔑 基础列（通用：seriesName/color/labelShow） + 散点图特有 symbolSize
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        { key: 'symbolSize', label: '点大小', type: 'number', min: 2, max: 40, width: 80 },
      ],
    },
  ],
  extraDefaults: {
    categories: SCATTER_DEFAULT_CATEGORIES,
    series: SCATTER_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default scatterChartDefinition

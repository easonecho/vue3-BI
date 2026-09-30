import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

export const BOXPLOT_MIN_WIDTH = 5
export const BOXPLOT_MAX_WIDTH = 50
export const BOXPLOT_DEFAULT_WIDTH = 20

/** 🔑 箱线图默认真实数据：5 个类别,每类一个 [min, Q1, median, Q3, max] 箱线数据 */
export const BOXPLOT_DEFAULT_CATEGORIES = ['类别1', '类别2', '类别3', '类别4', '类别5']
export const BOXPLOT_DEFAULT_SERIES = [
  {
    name: '分布',
    data: [
      [10, 20, 30, 40, 50],
      [15, 25, 35, 45, 60],
      [5, 15, 25, 35, 45],
      [20, 30, 40, 55, 70],
      [10, 22, 32, 42, 55],
    ],
  },
]

export const boxplotChartDefinition: ComponentDefinition = {
  type: 'boxplot-chart',
  meta: {
    name: '箱线图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'boxWidth',
      label: '箱体宽度',
      type: 'slider',
      min: BOXPLOT_MIN_WIDTH,
      max: BOXPLOT_MAX_WIDTH,
      default: BOXPLOT_DEFAULT_WIDTH,
      group: '样式',
    },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据系列名称单独配置颜色、是否显示标签（按名称匹配）',
      columns: [...baseSeriesStylesWithAxesColumns],
    },
    // 🔑 系列标签（箱线图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: BOXPLOT_DEFAULT_CATEGORIES,
    series: BOXPLOT_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'categoryField', label: '类目字段', type: 'category' },
    { key: 'valueFields', label: '数值字段', type: 'value', multiple: true },
  ],
}

export default boxplotChartDefinition

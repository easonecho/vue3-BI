import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

/** 🔑 象形柱图默认真实数据：7 天 + 1 系列 */
export const PICTORIAL_BAR_DEFAULT_CATEGORIES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const PICTORIAL_BAR_DEFAULT_SERIES = [
  { name: '访问量', data: [120, 200, 150, 80, 70, 110, 130] },
]

export const PICTORIAL_SYMBOL_MIN_SIZE = 5
export const PICTORIAL_SYMBOL_MAX_SIZE = 50
export const PICTORIAL_SYMBOL_DEFAULT_SIZE = 20

export const PICTORIAL_SYMBOL_OPTIONS = [
  { label: '矩形', value: 'rect' },
  { label: '圆形', value: 'circle' },
  { label: '圆角矩形', value: 'roundRect' },
  { label: '三角', value: 'triangle' },
  { label: '菱形', value: 'diamond' },
  { label: '图钉', value: 'pin' },
  { label: '箭头', value: 'arrow' },
] as const

export const pictorialBarChartDefinition: ComponentDefinition = {
  type: 'pictorial-bar-chart',
  meta: {
    name: '象形柱图',
    category: 'chart',
    icon: 'Histogram',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'symbol',
      label: '图形',
      type: 'select',
      options: [...PICTORIAL_SYMBOL_OPTIONS],
      default: 'roundRect',
      group: '样式',
    },
    {
      key: 'symbolRepeat',
      label: '重复图形',
      type: 'switch',
      default: true,
      group: '样式',
    },
    {
      key: 'symbolMargin',
      label: '图形间距',
      type: 'number',
      min: 0,
      max: 50,
      default: 2,
      group: '样式',
    },
    {
      key: 'symbolSize',
      label: '图形大小',
      type: 'slider',
      min: PICTORIAL_SYMBOL_MIN_SIZE,
      max: PICTORIAL_SYMBOL_MAX_SIZE,
      default: PICTORIAL_SYMBOL_DEFAULT_SIZE,
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
    // 🔑 系列标签（象形柱图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: PICTORIAL_BAR_DEFAULT_CATEGORIES,
    series: PICTORIAL_BAR_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'categoryField', label: '类目字段', type: 'category' },
    { key: 'valueFields', label: '数值字段', type: 'value', multiple: true },
  ],
}

export default pictorialBarChartDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartBaseSchema,
  baseSeriesStylesNoAxesColumns,
  buildSeriesLabelSchema,
  aggregatePropField,
  topNPropFields,
} from '../types'

/** 🔑 玫瑰图默认真实数据（[{name, value}, ...]） */
export const PIE_ROSE_DEFAULT_DATA = [
  { name: '类别A', value: 40 },
  { name: '类别B', value: 30 },
  { name: '类别C', value: 20 },
  { name: '类别D', value: 15 },
  { name: '类别E', value: 10 },
]

export const PIE_ROSE_RADIUS_INNER_MIN = 0
export const PIE_ROSE_RADIUS_INNER_MAX = 50
export const PIE_ROSE_RADIUS_INNER_DEFAULT = 10

export const PIE_ROSE_TYPE_OPTIONS = [
  { label: '半径玫瑰（radius）', value: 'radius' },
  { label: '面积玫瑰（area）', value: 'area' },
] as const

export const pieRoseChartDefinition: ComponentDefinition = {
  type: 'pie-rose-chart',
  meta: {
    name: '玫瑰图',
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 360,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    aggregatePropField,
    ...topNPropFields,
    {
      key: 'roseType',
      label: '玫瑰模式',
      type: 'select',
      options: [...PIE_ROSE_TYPE_OPTIONS],
      default: 'radius',
      group: '样式',
    },
    {
      key: 'radiusInner',
      label: '内半径 (%)',
      type: 'slider',
      min: PIE_ROSE_RADIUS_INNER_MIN,
      max: PIE_ROSE_RADIUS_INNER_MAX,
      default: PIE_ROSE_RADIUS_INNER_DEFAULT,
      group: '样式',
    },
    {
      key: 'seriesStyles',
      label: '数据项样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据项名称单独配置颜色、是否显示标签（按 name 匹配）',
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    // 🔑 系列标签（玫瑰图默认在外部）
    ...buildSeriesLabelSchema('outside'),
  ],
  extraDefaults: {
    pieData: PIE_ROSE_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'nameField', label: '名称字段', type: 'name' },
    { key: 'valueField', label: '数值字段', type: 'value' },
    { key: 'drillFields', label: '钻取字段', type: 'category', multiple: true },
  ],
}

export default pieRoseChartDefinition

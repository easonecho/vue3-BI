import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartCommonSchema,
  baseSeriesStylesNoAxesColumns,
  buildSeriesLabelSchema,
} from '../types'

/** 🔑 雷达图默认真实数据 */
export const RADAR_DEFAULT_INDICATOR = [
  { name: '销售', max: 6500 },
  { name: '管理', max: 16000 },
  { name: '信息技术', max: 30000 },
  { name: '客服', max: 38000 },
  { name: '研发', max: 52000 },
  { name: '市场', max: 25000 },
]
export const RADAR_DEFAULT_SERIES = [
  { name: '预算分配', value: [4200, 8000, 20000, 28000, 32000, 18000] },
  { name: '实际开销', value: [5000, 9000, 22000, 30000, 35000, 20000] },
]

const definition: ComponentDefinition = {
  type: 'radar-chart',
  meta: {
    name: '雷达图',
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 360,
    defaultHeight: 360,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    { key: 'shape', label: '形状', type: 'select', options: [
      { label: '多边形', value: 'polygon' },
      { label: '圆形', value: 'circle' },
    ], default: 'polygon', group: '样式' },
    { key: 'splitNumber', label: '分割段数', type: 'slider', min: 2, max: 10, default: 5, group: '样式' },
    { key: 'splitAreaShow', label: '显示分割区域', type: 'switch', default: true, group: '样式' },
    { key: 'axisNameShow', label: '显示指标名称', type: 'switch', default: true, group: '样式' },
    { key: 'axisNameColor', label: '指标名称颜色', type: 'colorpicker', default: '#6b7280', group: '样式' },
    { key: 'axisNameFontSize', label: '指标名称字号', type: 'slider', min: 10, max: 24, default: 12, group: '样式' },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据系列名称单独配置颜色、是否显示标签等（按 name 匹配）',
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    radarIndicator: RADAR_DEFAULT_INDICATOR,
    radarSeries: RADAR_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'nameField', label: '指标名称字段', type: 'name' },
    { key: 'valueField', label: '数值字段', type: 'value', multiple: true },
  ],
}

export default definition

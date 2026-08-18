import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartCommonSchema,
  baseSeriesStylesNoAxesColumns,
  buildSeriesLabelSchema,
} from '../types'

/** 🔑 漏斗图默认真实数据 */
export const FUNNEL_DEFAULT_DATA = [
  { name: '展现', value: 900 },
  { name: '点击', value: 600 },
  { name: '访问', value: 380 },
  { name: '咨询', value: 220 },
  { name: '订单', value: 120 },
  { name: '成交', value: 60 },
]

const definition: ComponentDefinition = {
  type: 'funnel-chart',
  meta: {
    name: '漏斗图',
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 360,
    defaultHeight: 360,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    { key: 'sort', label: '排序方式', type: 'select', options: [
      { label: '降序', value: 'descending' },
      { label: '升序', value: 'ascending' },
      { label: '按数据顺序', value: 'none' },
    ], default: 'descending', group: '样式' },
    { key: 'funnelAlign', label: '对齐方式', type: 'select', options: [
      { label: '居中', value: 'center' },
      { label: '左对齐', value: 'left' },
      { label: '右对齐', value: 'right' },
    ], default: 'center', group: '样式' },
    { key: 'minSize', label: '最小宽度(%)', type: 'slider', min: 0, max: 100, default: 0, group: '样式' },
    { key: 'maxSize', label: '最大宽度(%)', type: 'slider', min: 10, max: 100, default: 100, group: '样式' },
    { key: 'gap', label: '间隔(px)', type: 'slider', min: 0, max: 30, default: 2, group: '样式' },
    {
      key: 'seriesStyles',
      label: '数据项样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据漏斗图数据项名称单独配置颜色、是否显示标签等（按 name 匹配）',
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    ...buildSeriesLabelSchema('inside'),
  ],
  extraDefaults: {
    funnelData: FUNNEL_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'nameField', label: '名称字段', type: 'name' },
    { key: 'valueField', label: '数值字段', type: 'value' },
  ],
}

export default definition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartBaseSchema,
  baseSeriesStylesWithAxesColumns,
  buildSeriesLabelSchema,
} from '../types'

/** 🔑 面积图默认真实数据 */
export const AREA_DEFAULT_CATEGORIES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const AREA_DEFAULT_SERIES = [
  { name: '收入', data: [820, 932, 901, 934, 1290, 1330, 1320] },
  { name: '支出', data: [320, 432, 401, 534, 790, 830, 920] },
]

const definition: ComponentDefinition = {
  type: 'area-chart',
  meta: {
    name: '面积图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'smooth', label: '平滑曲线', type: 'switch', default: true, group: '样式' },
    { key: 'areaOpacity', label: '面积透明度', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.35, group: '样式' },
    { key: 'stack', label: '堆叠', type: 'switch', default: false, group: '样式' },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据系列名称单独配置颜色、线宽、面积、标签等（按名称匹配）',
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        { key: 'lineWidth', label: '线宽', type: 'number', min: 1, max: 10, width: 80 },
        { key: 'areaStyle', label: '面积填充', type: 'switch', width: 100 },
      ],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: AREA_DEFAULT_CATEGORIES,
    series: AREA_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'categoryField', label: '类目字段', type: 'category' },
    { key: 'valueFields', label: '数值字段', type: 'value', multiple: true },
  ],
}

export default definition

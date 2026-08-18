import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartBaseSchema,
  baseSeriesStylesWithAxesColumns,
  buildSeriesLabelSchema,
} from '../types'

/** 🔑 双轴组合图默认真实数据 */
export const COMBO_DEFAULT_CATEGORIES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
export const COMBO_DEFAULT_BAR = { name: '销售额', data: [120, 200, 150, 80, 70, 110, 130] }
export const COMBO_DEFAULT_LINE = { name: '增长率(%)', data: [10, 15, 8, 12, 18, 22, 25] }

const definition: ComponentDefinition = {
  type: 'combo-chart',
  meta: {
    name: '双轴组合图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'barWidth', label: '柱宽', type: 'slider', min: 5, max: 50, default: 20, group: '样式' },
    { key: 'smooth', label: '折线平滑', type: 'switch', default: true, group: '样式' },
    { key: 'rightAxisPercent', label: '右轴百分比显示', type: 'switch', default: true, group: '样式' },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据系列名称单独配置颜色、标签等（按名称匹配）',
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        { key: 'lineWidth', label: '线宽', type: 'number', min: 1, max: 10, width: 80 },
        { key: 'chartType', label: '图表类型', type: 'select', width: 100, options: [
          { label: '柱状', value: 'bar' },
          { label: '折线', value: 'line' },
        ] },
      ],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: COMBO_DEFAULT_CATEGORIES,
    barSeries: COMBO_DEFAULT_BAR,
    lineSeries: COMBO_DEFAULT_LINE,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'categoryField', label: '类目字段', type: 'category' },
    { key: 'barField', label: '柱状字段', type: 'value' },
    { key: 'lineField', label: '折线字段', type: 'value' },
  ],
}

export default definition

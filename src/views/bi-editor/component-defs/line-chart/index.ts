import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

/** 🔑 折线图默认真实数据 */
export const LINE_DEFAULT_CATEGORIES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const LINE_DEFAULT_SERIES = [
  { name: 'PV', data: [820, 932, 901, 934, 1290, 1330, 1320] },
  { name: 'UV', data: [320, 432, 401, 534, 790, 830, 920] },
]

export const lineChartDefinition: ComponentDefinition = {
  type: 'line-chart',
  meta: {
    name: '折线图',
    category: 'chart',
    icon: 'TrendCharts',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'smooth', label: '平滑曲线', type: 'switch', default: true, group: '样式' },
    { key: 'area', label: '面积填充', type: 'switch', default: false, group: '样式' },
    {
      key: 'pointSize',
      label: '点大小',
      type: 'slider',
      min: 0,
      max: 20,
      default: 6,
      group: '样式',
    },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据系列名称单独配置颜色、线宽、是否面积、标签等（按名称匹配）',
      // 🔑 基础列（通用：seriesName/color/labelShow） + 折线图特有 lineWidth / areaStyle
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        { key: 'lineWidth', label: '线宽', type: 'number', min: 1, max: 10, width: 80 },
        { key: 'areaStyle', label: '面积填充', type: 'switch', width: 100 },
      ],
    },
    // 🔑 系列标签（折线图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: LINE_DEFAULT_CATEGORIES,
    series: LINE_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default lineChartDefinition

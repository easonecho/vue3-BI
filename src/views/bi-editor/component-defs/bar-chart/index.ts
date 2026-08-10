import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

export const BAR_MIN_WIDTH = 5
export const BAR_MAX_WIDTH = 50
export const BAR_DEFAULT_WIDTH = 10

/** 🔑 柱状图默认真实数据（后续将用于 seriesStyles 初始化 + Widget 默认渲染） */
export const BAR_DEFAULT_CATEGORIES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const BAR_DEFAULT_SERIES = [
  { name: '访问量', data: [120, 200, 150, 80, 70, 110, 130] },
  { name: '订单量', data: [60, 140, 90, 50, 40, 70, 85] },
  { name: '销售额', data: [220, 380, 300, 160, 140, 210, 260] },
]

export const barChartDefinition: ComponentDefinition = {
  type: 'bar-chart',
  meta: {
    name: '柱状图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'barWidth',
      label: '柱宽',
      type: 'slider',
      min: BAR_MIN_WIDTH,
      max: BAR_MAX_WIDTH,
      default: BAR_DEFAULT_WIDTH,
      group: '样式',
    },
    {
      key: 'barGap',
      label: '柱间距',
      type: 'slider',
      min: 0,
      max: 100,
      default: 30,
      group: '样式',
    },
    { key: 'stack', label: '堆叠', type: 'switch', default: false, group: '样式' },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据系列名称单独配置颜色、圆角、标签等（按名称匹配）',
      // 🔑 基础列（通用：seriesName/color/labelShow） + 柱状图特有的 borderRadius
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        { key: 'borderRadius', label: '圆角', type: 'number', min: 0, max: 20, width: 80 },
      ],
    },
    // 🔑 系列标签：每个系列的 label 独立 5 项样式 + 位置（柱状图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  /** 🔑 复杂数据默认值（不适合表单编辑的字段），仅在此声明一次 */
  extraDefaults: {
    categories: BAR_DEFAULT_CATEGORIES,
    series: BAR_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default barChartDefinition

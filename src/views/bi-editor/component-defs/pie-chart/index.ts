import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, baseSeriesStylesNoAxesColumns } from '../types' // 饼图没有 X/Y 轴，只引入通用 Schema（title/legend/tooltip/animation）

/** 🔑 饼图默认真实数据（[{name, value}, ...]） */
export const PIE_DEFAULT_DATA = [
  { name: '直接访问', value: 335 },
  { name: '搜索引擎', value: 310 },
  { name: '邮件营销', value: 234 },
  { name: '联盟广告', value: 135 },
  { name: '视频广告', value: 1548 },
]

export const pieChartDefinition: ComponentDefinition = {
  type: 'pie-chart',
  meta: {
    name: '饼图',
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 300,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'radius',
      label: '外半径 (%)',
      type: 'slider',
      min: 20,
      max: 80,
      default: 55,
      group: '样式',
    },
    { key: 'rose', label: '玫瑰图', type: 'switch', default: false, group: '样式' },
    { key: 'donut', label: '环形图', type: 'switch', default: true, group: '样式' },
    {
      key: 'innerRadius',
      label: '内半径 (%)',
      type: 'slider',
      min: 5,
      max: 70,
      default: 35,
      group: '样式',
      visibleWhen: { field: 'donut', truthy: true },
    },
    {
      key: 'seriesStyles',
      label: '数据项样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据饼图数据项名称单独配置颜色、是否显示标签等（按 name 匹配）',
      // 🔑 无坐标轴通用列：name/color/labelShow（饼图目前没有特殊列，直接用基础）
      columns: [...baseSeriesStylesNoAxesColumns],
    },
  ],
  extraDefaults: {
    pieData: PIE_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default pieChartDefinition

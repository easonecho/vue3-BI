import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartBaseSchema,
  baseSeriesStylesWithAxesColumns,
  buildSeriesLabelSchema,
  aggregatePropField,
  topNPropFields,
} from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const BAR_MIN_WIDTH = 5
export const BAR_MAX_WIDTH = 50
export const BAR_DEFAULT_WIDTH = 10

/** 🔑 柱状图默认真实数据（后续将用于 seriesStyles 初始化 + Widget 默认渲染） */
export const BAR_DEFAULT_CATEGORIES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const BAR_DEFAULT_SERIES = [
  { name: t('editorMaterial.series.visits'), data: [120, 200, 150, 80, 70, 110, 130] },
  { name: t('editorMaterial.series.orders'), data: [60, 140, 90, 50, 40, 70, 85] },
  { name: t('editorMaterial.series.sales'), data: [220, 380, 300, 160, 140, 210, 260] },
]

export const barChartDefinition: ComponentDefinition = {
  type: 'bar-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.barChart')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    aggregatePropField,
    ...topNPropFields,
    {
      key: 'barWidth',
      get label() {
        return t('editorMaterial.ui.barWidth')
      },
      type: 'slider',
      min: BAR_MIN_WIDTH,
      max: BAR_MAX_WIDTH,
      default: BAR_DEFAULT_WIDTH,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'barGap',
      get label() {
        return t('editorMaterial.ui.barGap')
      },
      type: 'slider',
      min: 0,
      max: 100,
      default: 30,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'stack',
      get label() {
        return t('editorMaterial.ui.stack')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'seriesStyles',
      get label() {
        return t('editorMaterial.ui.seriesStyles')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.dataSeries')
      },
      get tip() {
        return t('editorMaterial.ui.configureColorCornerRadiusAndLabelsPerSeriesByName')
      },
      // 🔑 基础列（通用：seriesName/color/labelShow） + 柱状图特有的 borderRadius
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        {
          key: 'borderRadius',
          get label() {
            return t('editorMaterial.ui.cornerRadius')
          },
          type: 'number',
          min: 0,
          max: 20,
          width: 80,
        },
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
  dataBindingSchema: [
    {
      key: 'categoryField',
      get label() {
        return t('editorMaterial.ui.categoryField')
      },
      type: 'category',
    },
    {
      key: 'valueFields',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
      multiple: true,
    },
    {
      key: 'drillFields',
      get label() {
        return t('editorMaterial.ui.drillField')
      },
      type: 'category',
      multiple: true,
    },
  ],
}

export default barChartDefinition

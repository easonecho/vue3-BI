import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 散点图默认真实数据：每个系列是 {name, data: [[x,y], ...]} */
export const SCATTER_DEFAULT_CATEGORIES = null as unknown as string[] | null
export const SCATTER_DEFAULT_SERIES = [
  {
    name: '男',
    data: [
      [160, 52],
      [165, 55],
      [170, 60],
      [175, 65],
      [180, 70],
    ],
  },
  {
    name: '女',
    data: [
      [155, 45],
      [160, 50],
      [165, 53],
      [170, 58],
      [175, 62],
    ],
  },
]

export const scatterChartDefinition: ComponentDefinition = {
  type: 'scatter-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.scatterChart')
    },
    category: 'chart',
    icon: 'DataPoint',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'symbolSize',
      get label() {
        return t('editorMaterial.ui.pointSize')
      },
      type: 'slider',
      min: 2,
      max: 30,
      default: 10,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'showLabel',
      get label() {
        return t('editorMaterial.ui.showLabel')
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
        return t('editorMaterial.ui.configureColorPointSizeAndLabelVisibilityPerSeriesByName')
      },
      // 🔑 基础列（通用：seriesName/color/labelShow） + 散点图特有 symbolSize
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        {
          key: 'symbolSize',
          get label() {
            return t('editorMaterial.ui.pointSize')
          },
          type: 'number',
          min: 2,
          max: 40,
          width: 80,
        },
      ],
    },
    // 🔑 系列标签（散点图默认在顶部，因 formatter 是 "(x,y)" 的小字，默认字号更合适）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: SCATTER_DEFAULT_CATEGORIES,
    series: SCATTER_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'xField',
      get label() {
        return t('editorMaterial.ui.xAxisField')
      },
      type: 'value',
    },
    {
      key: 'yField',
      get label() {
        return t('editorMaterial.ui.yAxisField')
      },
      type: 'value',
    },
    {
      key: 'seriesField',
      get label() {
        return t('editorMaterial.ui.seriesFieldOptional')
      },
      type: 'category',
    },
  ],
}

export default scatterChartDefinition

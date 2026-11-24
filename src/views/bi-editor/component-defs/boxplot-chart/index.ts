import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const BOXPLOT_MIN_WIDTH = 5
export const BOXPLOT_MAX_WIDTH = 50
export const BOXPLOT_DEFAULT_WIDTH = 20

/** 🔑 箱线图默认真实数据：5 个类别,每类一个 [min, Q1, median, Q3, max] 箱线数据 */
export const BOXPLOT_DEFAULT_CATEGORIES = ['类别1', '类别2', '类别3', '类别4', '类别5']
export const BOXPLOT_DEFAULT_SERIES = [
  {
    name: t('editorMaterial.ui.distribution'),
    data: [
      [10, 20, 30, 40, 50],
      [15, 25, 35, 45, 60],
      [5, 15, 25, 35, 45],
      [20, 30, 40, 55, 70],
      [10, 22, 32, 42, 55],
    ],
  },
]

export const boxplotChartDefinition: ComponentDefinition = {
  type: 'boxplot-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.boxPlot')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'boxWidth',
      get label() {
        return t('editorMaterial.ui.boxWidth')
      },
      type: 'slider',
      min: BOXPLOT_MIN_WIDTH,
      max: BOXPLOT_MAX_WIDTH,
      default: BOXPLOT_DEFAULT_WIDTH,
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
        return t('editorMaterial.ui.configureColorAndLabelVisibilityPerSeriesByName3')
      },
      columns: [...baseSeriesStylesWithAxesColumns],
    },
    // 🔑 系列标签（箱线图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: BOXPLOT_DEFAULT_CATEGORIES,
    series: BOXPLOT_DEFAULT_SERIES,
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
  ],
}

export default boxplotChartDefinition

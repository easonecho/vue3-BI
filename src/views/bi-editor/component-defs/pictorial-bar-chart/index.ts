import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 象形柱图默认真实数据：7 天 + 1 系列 */
export const PICTORIAL_BAR_DEFAULT_CATEGORIES = [
  '周一',
  '周二',
  '周三',
  '周四',
  '周五',
  '周六',
  '周日',
]
export const PICTORIAL_BAR_DEFAULT_SERIES = [
  { name: t('editorMaterial.series.visits'), data: [120, 200, 150, 80, 70, 110, 130] },
]

export const PICTORIAL_SYMBOL_MIN_SIZE = 5
export const PICTORIAL_SYMBOL_MAX_SIZE = 50
export const PICTORIAL_SYMBOL_DEFAULT_SIZE = 20

export const PICTORIAL_SYMBOL_OPTIONS = [
  {
    get label() {
      return t('editorMaterial.ui.rectangle')
    },
    value: 'rect',
  },
  {
    get label() {
      return t('editorMaterial.ui.circle')
    },
    value: 'circle',
  },
  {
    get label() {
      return t('editorMaterial.ui.roundedRectangle')
    },
    value: 'roundRect',
  },
  {
    get label() {
      return t('editorMaterial.ui.triangle')
    },
    value: 'triangle',
  },
  {
    get label() {
      return t('editorMaterial.ui.diamond')
    },
    value: 'diamond',
  },
  {
    get label() {
      return t('editorMaterial.ui.pin')
    },
    value: 'pin',
  },
  {
    get label() {
      return t('editorMaterial.ui.arrow')
    },
    value: 'arrow',
  },
] as const

export const pictorialBarChartDefinition: ComponentDefinition = {
  type: 'pictorial-bar-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.pictorialBarChart')
    },
    category: 'chart',
    icon: 'Histogram',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'symbol',
      get label() {
        return t('editorMaterial.ui.shape')
      },
      type: 'select',
      options: [...PICTORIAL_SYMBOL_OPTIONS],
      default: 'roundRect',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'symbolRepeat',
      get label() {
        return t('editorMaterial.ui.repeatShape')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'symbolMargin',
      get label() {
        return t('editorMaterial.ui.shapeGap')
      },
      type: 'number',
      min: 0,
      max: 50,
      default: 2,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'symbolSize',
      get label() {
        return t('editorMaterial.ui.shapeSize')
      },
      type: 'slider',
      min: PICTORIAL_SYMBOL_MIN_SIZE,
      max: PICTORIAL_SYMBOL_MAX_SIZE,
      default: PICTORIAL_SYMBOL_DEFAULT_SIZE,
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
    // 🔑 系列标签（象形柱图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: PICTORIAL_BAR_DEFAULT_CATEGORIES,
    series: PICTORIAL_BAR_DEFAULT_SERIES,
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

export default pictorialBarChartDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 置信区间图默认数据：12 个月,实际值/预测值/上下界各 1 组
 *  data 允许 null：折线在缺口处（实际值与预测值衔接处）用 null 断开 */
function buildConfidenceBandDefaults(): {
  categories: string[]
  series: { name: string; data: (number | null)[] }[]
} {
  const categories = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ]
  // 🔑 实际值（前 8 个月）+ 预测值（后 4 个月,从实际值末尾衔接）
  const actual = [120, 132, 101, 134, 90, 230, 210, 182]
  const forecast = [182, 191, 234, 220]
  // 🔑 上界/下界（与预测值配套,实际值区间收窄为 0）
  const upper = [120, 132, 101, 134, 90, 230, 210, 182, 200, 215, 260, 250]
  const lower = [120, 132, 101, 134, 90, 230, 210, 182, 165, 167, 190, 195]
  // 🔑 把 actual + forecast 合并成一条线（forecast 从 actual 末尾衔接，缺口用 null 断开）
  const actualFull: (number | null)[] = [...actual, null, null, null, null]
  const forecastFull: (number | null)[] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    ...forecast,
  ]
  return {
    categories,
    series: [
      { name: t('editorMaterial.series.actual'), data: actualFull },
      { name: t('editorMaterial.series.predicted'), data: forecastFull },
      { name: t('editorMaterial.series.upperBound'), data: upper },
      { name: t('editorMaterial.series.lowerBound'), data: lower },
    ],
  }
}

const confidenceBandDefaults = buildConfidenceBandDefaults()

export const CONFIDENCE_BAND_DEFAULT_CATEGORIES = confidenceBandDefaults.categories
export const CONFIDENCE_BAND_DEFAULT_SERIES = confidenceBandDefaults.series

export const CONFIDENCE_BAND_DEFAULT_BAND_COLOR = 'rgba(84,112,198,0.2)'
export const CONFIDENCE_BAND_DEFAULT_ACTUAL_COLOR = '#5470c6'
export const CONFIDENCE_BAND_DEFAULT_FORECAST_COLOR = '#ee6666'

export const confidenceBandChartDefinition: ComponentDefinition = {
  type: 'confidence-band-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.confidenceBandChart')
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
      key: 'bandColor',
      get label() {
        return t('editorMaterial.ui.bandColor')
      },
      type: 'colorpicker',
      default: CONFIDENCE_BAND_DEFAULT_BAND_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'actualColor',
      get label() {
        return t('editorMaterial.ui.actualValueColor')
      },
      type: 'colorpicker',
      default: CONFIDENCE_BAND_DEFAULT_ACTUAL_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'forecastColor',
      get label() {
        return t('editorMaterial.ui.predictedValueColor')
      },
      type: 'colorpicker',
      default: CONFIDENCE_BAND_DEFAULT_FORECAST_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'bandOpacity',
      get label() {
        return t('editorMaterial.ui.bandOpacity')
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
      key: 'showActual',
      get label() {
        return t('editorMaterial.ui.showActualValue')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.show')
      },
    },
    {
      key: 'showForecast',
      get label() {
        return t('editorMaterial.ui.showPredictedValue')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.show')
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
        return t('editorMaterial.ui.configureColorAndLabelVisibilityPerSeriesByName')
      },
      columns: [...baseSeriesStylesWithAxesColumns],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: CONFIDENCE_BAND_DEFAULT_CATEGORIES,
    series: CONFIDENCE_BAND_DEFAULT_SERIES,
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

export default confidenceBandChartDefinition

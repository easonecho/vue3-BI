import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

/** 🔑 置信区间图默认数据：12 个月,实际值/预测值/上下界各 1 组 */
function buildConfidenceBandDefaults(): {
  categories: string[]
  series: { name: string; data: number[] }[]
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
  // 🔑 把 actual + forecast 合并成一条线（forecast 从 actual 末尾衔接）
  const actualFull = [...actual, null, null, null, null]
  const forecastFull = [null, null, null, null, null, null, null, null, ...forecast]
  return {
    categories,
    series: [
      { name: '实际值', data: actualFull as any },
      { name: '预测值', data: forecastFull as any },
      { name: '上界', data: upper },
      { name: '下界', data: lower },
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
    name: '置信区间图',
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
      label: '区间带颜色',
      type: 'colorpicker',
      default: CONFIDENCE_BAND_DEFAULT_BAND_COLOR,
      group: '颜色',
    },
    {
      key: 'actualColor',
      label: '实际值颜色',
      type: 'colorpicker',
      default: CONFIDENCE_BAND_DEFAULT_ACTUAL_COLOR,
      group: '颜色',
    },
    {
      key: 'forecastColor',
      label: '预测值颜色',
      type: 'colorpicker',
      default: CONFIDENCE_BAND_DEFAULT_FORECAST_COLOR,
      group: '颜色',
    },
    {
      key: 'bandOpacity',
      label: '区间带透明度',
      type: 'slider',
      min: 0,
      max: 100,
      default: 30,
      group: '样式',
    },
    { key: 'showActual', label: '显示实际值', type: 'switch', default: true, group: '显示' },
    { key: 'showForecast', label: '显示预测值', type: 'switch', default: true, group: '显示' },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据数据系列名称单独配置颜色、是否显示标签（按名称匹配）',
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
    { key: 'categoryField', label: '类目字段', type: 'category' },
    { key: 'valueFields', label: '数值字段', type: 'value', multiple: true },
  ],
}

export default confidenceBandChartDefinition

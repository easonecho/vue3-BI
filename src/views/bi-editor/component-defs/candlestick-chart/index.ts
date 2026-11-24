import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 K 线图默认真实数据：30 天的 OHLC（开/收/低/高）数据 */
function buildCandlestickDefaults(): { categories: string[]; data: number[][] } {
  const categories: string[] = []
  const data: number[][] = []
  let lastClose = 100
  // 🔑 使用固定种子伪随机,保证每次加载结果一致,避免 SSR/热更新数据抖动
  let seed = 42
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const startDate = new Date(2024, 0, 1)
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    categories.push(`${d.getMonth() + 1}/${d.getDate()}`)
    const open = +lastClose.toFixed(2)
    const close = +(open + (rand() - 0.5) * 10).toFixed(2)
    const low = +(Math.min(open, close) - rand() * 3).toFixed(2)
    const high = +(Math.max(open, close) + rand() * 3).toFixed(2)
    data.push([open, close, low, high])
    lastClose = close
  }
  return { categories, data }
}

const candlestickDefaults = buildCandlestickDefaults()

export const CANDLESTICK_DEFAULT_CATEGORIES = candlestickDefaults.categories
export const CANDLESTICK_DEFAULT_SERIES = [
  {
    name: t('editorMaterial.ui.dailyK'),
    data: candlestickDefaults.data,
  },
]

/** 🔑 涨跌颜色（中国大陆惯例:红涨绿跌） */
export const CANDLESTICK_DEFAULT_UP_COLOR = '#ee6666'
export const CANDLESTICK_DEFAULT_DOWN_COLOR = '#2ec07e'

export const candlestickChartDefinition: ComponentDefinition = {
  type: 'candlestick-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.candlestickChart')
    },
    category: 'chart',
    icon: 'Histogram',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'upColor',
      get label() {
        return t('editorMaterial.ui.upCandleColor')
      },
      type: 'colorpicker',
      default: CANDLESTICK_DEFAULT_UP_COLOR,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'downColor',
      get label() {
        return t('editorMaterial.ui.downCandleColor')
      },
      type: 'colorpicker',
      default: CANDLESTICK_DEFAULT_DOWN_COLOR,
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
    // 🔑 系列标签（K 线图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: CANDLESTICK_DEFAULT_CATEGORIES,
    series: CANDLESTICK_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'categoryField',
      get label() {
        return t('editorMaterial.ui.dateField')
      },
      type: 'category',
    },
    {
      key: 'valueFields',
      get label() {
        return t('editorMaterial.ui.ohlcField')
      },
      type: 'value',
      multiple: true,
    },
  ],
}

export default candlestickChartDefinition

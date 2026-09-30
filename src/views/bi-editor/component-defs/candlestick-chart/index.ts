import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

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
    name: '日K',
    data: candlestickDefaults.data,
  },
]

/** 🔑 涨跌颜色（中国大陆惯例:红涨绿跌） */
export const CANDLESTICK_DEFAULT_UP_COLOR = '#ee6666'
export const CANDLESTICK_DEFAULT_DOWN_COLOR = '#2ec07e'

export const candlestickChartDefinition: ComponentDefinition = {
  type: 'candlestick-chart',
  meta: {
    name: 'K线图',
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
      label: '阳线颜色（涨）',
      type: 'colorpicker',
      default: CANDLESTICK_DEFAULT_UP_COLOR,
      group: '样式',
    },
    {
      key: 'downColor',
      label: '阴线颜色（跌）',
      type: 'colorpicker',
      default: CANDLESTICK_DEFAULT_DOWN_COLOR,
      group: '样式',
    },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '根据系列名称单独配置颜色、是否显示标签（按名称匹配）',
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
    { key: 'categoryField', label: '日期字段', type: 'category' },
    { key: 'valueFields', label: 'OHLC字段', type: 'value', multiple: true },
  ],
}

export default candlestickChartDefinition

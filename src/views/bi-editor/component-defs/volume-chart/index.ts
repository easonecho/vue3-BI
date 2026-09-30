import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

/** 🔑 成交量图默认数据：14 天,volume 量级 1000-5000,amount 量级 100k-500k */
function buildVolumeDefaults(): { categories: string[]; series: { name: string; data: number[] }[] } {
  const categories: string[] = []
  const volume: number[] = []
  const amount: number[] = []
  // 🔑 固定种子伪随机,保证每次加载结果一致,避免 SSR/热更新数据抖动
  let seed = 42
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const startDate = new Date(2024, 0, 1)
  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    categories.push(`${d.getMonth() + 1}/${d.getDate()}`)
    volume.push(Math.round(1000 + rand() * 4000))
    amount.push(Math.round(100000 + rand() * 400000))
  }
  return {
    categories,
    series: [
      { name: '成交量', data: volume },
      { name: '成交额', data: amount },
    ],
  }
}

const volumeDefaults = buildVolumeDefaults()

export const VOLUME_DEFAULT_CATEGORIES = volumeDefaults.categories
export const VOLUME_DEFAULT_SERIES = volumeDefaults.series

/** 🔑 涨跌颜色（中国大陆惯例:红涨绿跌） */
export const VOLUME_DEFAULT_UP_COLOR = '#ee6666'
export const VOLUME_DEFAULT_DOWN_COLOR = '#2ec07e'

export const volumeChartDefinition: ComponentDefinition = {
  type: 'volume-chart',
  meta: {
    name: '成交量图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 200,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'barWidth',
      label: '柱宽',
      type: 'slider',
      min: 5,
      max: 30,
      default: 10,
      group: '样式',
    },
    {
      key: 'upColor',
      label: '阳线颜色（涨）',
      type: 'colorpicker',
      default: VOLUME_DEFAULT_UP_COLOR,
      group: '样式',
    },
    {
      key: 'downColor',
      label: '阴线颜色（跌）',
      type: 'colorpicker',
      default: VOLUME_DEFAULT_DOWN_COLOR,
      group: '样式',
    },
    { key: 'showMA', label: '显示均线', type: 'switch', default: true, group: '均线' },
    {
      key: 'maPeriod',
      label: '均线周期',
      type: 'number',
      default: 5,
      group: '均线',
      visibleWhen: { field: 'showMA', truthy: true },
    },
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
    categories: VOLUME_DEFAULT_CATEGORIES,
    series: VOLUME_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'categoryField', label: '日期字段', type: 'category' },
    { key: 'valueFields', label: '数值字段', type: 'value', multiple: true },
  ],
}

export default volumeChartDefinition

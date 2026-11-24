import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesWithAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 成交量图默认数据：14 天,volume 量级 1000-5000,amount 量级 100k-500k */
function buildVolumeDefaults(): {
  categories: string[]
  series: { name: string; data: number[] }[]
} {
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
      { name: t('editorMaterial.series.volume'), data: volume },
      { name: t('editorMaterial.series.turnover'), data: amount },
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
    get name() {
      return t('editorMaterial.meta.volumeChart')
    },
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
      get label() {
        return t('editorMaterial.ui.barWidth')
      },
      type: 'slider',
      min: 5,
      max: 30,
      default: 10,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'upColor',
      get label() {
        return t('editorMaterial.ui.upCandleColor')
      },
      type: 'colorpicker',
      default: VOLUME_DEFAULT_UP_COLOR,
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
      default: VOLUME_DEFAULT_DOWN_COLOR,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'showMA',
      get label() {
        return t('editorMaterial.ui.showMa')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.movingAverage')
      },
    },
    {
      key: 'maPeriod',
      get label() {
        return t('editorMaterial.ui.maPeriod')
      },
      type: 'number',
      default: 5,
      get group() {
        return t('editorMaterial.ui.movingAverage')
      },
      visibleWhen: { field: 'showMA', truthy: true },
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
    categories: VOLUME_DEFAULT_CATEGORIES,
    series: VOLUME_DEFAULT_SERIES,
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
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
      multiple: true,
    },
  ],
}

export default volumeChartDefinition

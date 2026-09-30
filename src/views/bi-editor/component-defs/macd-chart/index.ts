import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, buildSeriesLabelSchema } from '../types'

/** 🔑 MACD 指标图默认数据：20 天,DIF 在 -1 到 1 之间波动,DEA 是 DIF 的均线,MACD = (DIF - DEA) * 2 */
function buildMacdDefaults(): {
  categories: string[]
  dif: number[]
  dea: number[]
  macd: number[]
} {
  const categories: string[] = []
  const dif: number[] = []
  const dea: number[] = []
  const macd: number[] = []
  // 🔑 固定种子伪随机,保证每次加载结果一致
  let seed = 42
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const startDate = new Date(2024, 0, 1)
  // 先生成 DIF,再用 DIF 的均线（EMA 简化为 SMA 近似）生成 DEA,最后 MACD = (DIF - DEA) * 2
  const difRaw: number[] = []
  let lastDif = 0
  for (let i = 0; i < 20; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    categories.push(`${d.getMonth() + 1}/${d.getDate()}`)
    lastDif = +(lastDif + (rand() - 0.5) * 0.5).toFixed(4)
    // 限制在 -1 到 1 之间
    lastDif = Math.max(-1, Math.min(1, lastDif))
    difRaw.push(lastDif)
  }
  // DEA 用 9 日 SMA 近似（前 8 天用 DIF 兜底）
  const deaPeriod = 9
  for (let i = 0; i < difRaw.length; i++) {
    if (i < deaPeriod - 1) {
      dea.push(+difRaw[i].toFixed(4))
    } else {
      let sum = 0
      for (let j = i - deaPeriod + 1; j <= i; j++) sum += difRaw[j]
      dea.push(+(sum / deaPeriod).toFixed(4))
    }
  }
  for (let i = 0; i < difRaw.length; i++) {
    dif.push(difRaw[i])
    macd.push(+((difRaw[i] - dea[i]) * 2).toFixed(4))
  }
  return { categories, dif, dea, macd }
}

const macdDefaults = buildMacdDefaults()

export const MACD_DEFAULT_CATEGORIES = macdDefaults.categories
export const MACD_DEFAULT_DIF = macdDefaults.dif
export const MACD_DEFAULT_DEA = macdDefaults.dea
export const MACD_DEFAULT_MACD = macdDefaults.macd

export const MACD_DEFAULT_DIF_COLOR = '#5470c6'
export const MACD_DEFAULT_DEA_COLOR = '#fac858'
export const MACD_DEFAULT_UP_COLOR = '#ee6666'
export const MACD_DEFAULT_DOWN_COLOR = '#2ec07e'

export const macdChartDefinition: ComponentDefinition = {
  type: 'macd-chart',
  meta: {
    name: 'MACD指标图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 240,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'showDIF', label: '显示 DIF', type: 'switch', default: true, group: '线条' },
    { key: 'showDEA', label: '显示 DEA', type: 'switch', default: true, group: '线条' },
    { key: 'showMACD', label: '显示 MACD', type: 'switch', default: true, group: '线条' },
    {
      key: 'difColor',
      label: 'DIF 颜色',
      type: 'colorpicker',
      default: MACD_DEFAULT_DIF_COLOR,
      group: '颜色',
      visibleWhen: { field: 'showDIF', truthy: true },
    },
    {
      key: 'deaColor',
      label: 'DEA 颜色',
      type: 'colorpicker',
      default: MACD_DEFAULT_DEA_COLOR,
      group: '颜色',
      visibleWhen: { field: 'showDEA', truthy: true },
    },
    {
      key: 'macdUpColor',
      label: 'MACD 阳柱（正）',
      type: 'colorpicker',
      default: MACD_DEFAULT_UP_COLOR,
      group: '颜色',
      visibleWhen: { field: 'showMACD', truthy: true },
    },
    {
      key: 'macdDownColor',
      label: 'MACD 阴柱（负）',
      type: 'colorpicker',
      default: MACD_DEFAULT_DOWN_COLOR,
      group: '颜色',
      visibleWhen: { field: 'showMACD', truthy: true },
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: MACD_DEFAULT_CATEGORIES,
    dif: MACD_DEFAULT_DIF,
    dea: MACD_DEFAULT_DEA,
    macd: MACD_DEFAULT_MACD,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'categoryField', label: '日期字段', type: 'category' },
    { key: 'difField', label: 'DIF字段', type: 'value' },
    { key: 'deaField', label: 'DEA字段', type: 'value' },
    { key: 'macdField', label: 'MACD字段', type: 'value' },
  ],
}

export default macdChartDefinition

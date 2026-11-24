import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

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
    get name() {
      return t('editorMaterial.meta.macdChart')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 240,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'showDIF',
      get label() {
        return t('editorMaterial.ui.showDif')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.line')
      },
    },
    {
      key: 'showDEA',
      get label() {
        return t('editorMaterial.ui.showDea')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.line')
      },
    },
    {
      key: 'showMACD',
      get label() {
        return t('editorMaterial.ui.showMacd')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.line')
      },
    },
    {
      key: 'difColor',
      get label() {
        return t('editorMaterial.ui.difColor')
      },
      type: 'colorpicker',
      default: MACD_DEFAULT_DIF_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
      visibleWhen: { field: 'showDIF', truthy: true },
    },
    {
      key: 'deaColor',
      get label() {
        return t('editorMaterial.ui.deaColor')
      },
      type: 'colorpicker',
      default: MACD_DEFAULT_DEA_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
      visibleWhen: { field: 'showDEA', truthy: true },
    },
    {
      key: 'macdUpColor',
      get label() {
        return t('editorMaterial.ui.macdPositiveBar')
      },
      type: 'colorpicker',
      default: MACD_DEFAULT_UP_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
      visibleWhen: { field: 'showMACD', truthy: true },
    },
    {
      key: 'macdDownColor',
      get label() {
        return t('editorMaterial.ui.macdNegativeBar')
      },
      type: 'colorpicker',
      default: MACD_DEFAULT_DOWN_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
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
    {
      key: 'categoryField',
      get label() {
        return t('editorMaterial.ui.dateField')
      },
      type: 'category',
    },
    {
      key: 'difField',
      get label() {
        return t('editorMaterial.ui.difField')
      },
      type: 'value',
    },
    {
      key: 'deaField',
      get label() {
        return t('editorMaterial.ui.deaField')
      },
      type: 'value',
    },
    {
      key: 'macdField',
      get label() {
        return t('editorMaterial.ui.macdField')
      },
      type: 'value',
    },
  ],
}

export default macdChartDefinition

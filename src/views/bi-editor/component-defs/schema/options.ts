import type { SelectOption } from './props'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 ECharts 标准调色板（9 色）—— 给每个 series 按 index 循环分配默认色 */
export const ECHARTS_DEFAULT_PALETTE: readonly string[] = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
] as const

// ================= 文本样式公共 select 选项 =================
/** 字体家族选项（给每个可单独配文本样式的子分组复用） */
export const FONT_FAMILY_OPTIONS: readonly SelectOption[] = [
  {
    get label() {
      return t('editorMaterial.ui.systemDefaultPingfangSegoeUi')
    },
    value:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    get label() {
      return t('editorMaterial.ui.microsoftYaheiPingfangSc')
    },
    value: '"Microsoft YaHei", "PingFang SC", sans-serif',
  },
  {
    get label() {
      return t('editorMaterial.ui.simsunSongtiSc')
    },
    value: '"SimSun", "Songti SC", serif',
  },
  {
    get label() {
      return t('editorMaterial.ui.arialSansSerif')
    },
    value: 'Arial, Helvetica, sans-serif',
  },
  {
    get label() {
      return t('editorMaterial.ui.timesNewRomanSerif')
    },
    value: '"Times New Roman", Times, serif',
  },
  {
    get label() {
      return t('editorMaterial.ui.consolasMonospace')
    },
    value: 'Consolas, "Courier New", monospace',
  },
] as const

/** 字重选项（normal / bold / 100~900） */
export const FONT_WEIGHT_OPTIONS: readonly SelectOption[] = [
  {
    get label() {
      return t('editorMaterial.ui.thin100')
    },
    value: 100,
  },
  {
    get label() {
      return t('editorMaterial.ui.light300')
    },
    value: 300,
  },
  {
    get label() {
      return t('editorMaterial.ui.normal400Normal')
    },
    value: 'normal',
  },
  {
    get label() {
      return t('editorMaterial.ui.medium500')
    },
    value: 500,
  },
  {
    get label() {
      return t('editorMaterial.ui.semiBold600')
    },
    value: 600,
  },
  {
    get label() {
      return t('editorMaterial.ui.bold700Bold')
    },
    value: 'bold',
  },
  {
    get label() {
      return t('editorMaterial.ui.heavy900')
    },
    value: 900,
  },
] as const

/** 字体样式（常规 / 斜体） */
export const FONT_STYLE_OPTIONS: readonly SelectOption[] = [
  {
    get label() {
      return t('editorMaterial.ui.normal')
    },
    value: 'normal',
  },
  {
    get label() {
      return t('editorMaterial.ui.italic')
    },
    value: 'italic',
  },
  {
    get label() {
      return t('editorMaterial.ui.obliqueSlanted')
    },
    value: 'oblique',
  },
] as const

/** 字体家族默认值（与 FONT_FAMILY_OPTIONS[0].value 保持一致） */
export const DEFAULT_FONT_FAMILY: string =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** 🔑 聚合方式选项 (图表数据下推) */
export const AGGREGATE_OPTIONS: readonly SelectOption[] = [
  {
    get label() {
      return t('editorMaterial.ui.noAggregationRawRows')
    },
    value: 'none',
  },
  {
    get label() {
      return t('editorMaterial.ui.sum')
    },
    value: 'sum',
  },
  {
    get label() {
      return t('editorMaterial.ui.average')
    },
    value: 'avg',
  },
  {
    get label() {
      return t('editorMaterial.ui.count')
    },
    value: 'count',
  },
  {
    get label() {
      return t('editorMaterial.ui.distinctCount')
    },
    value: 'countDistinct',
  },
  {
    get label() {
      return t('editorMaterial.ui.max')
    },
    value: 'max',
  },
  {
    get label() {
      return t('editorMaterial.ui.min')
    },
    value: 'min',
  },
] as const

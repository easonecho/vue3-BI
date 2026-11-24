import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesNoAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 主题河流图默认真实数据：7 天 × 3 主题 = 21 个三元组 [date, value, name] */
export const THEME_RIVER_DEFAULT_DIM = [
  '2024/1/1',
  '2024/1/2',
  '2024/1/3',
  '2024/1/4',
  '2024/1/5',
  '2024/1/6',
  '2024/1/7',
]

export const THEME_RIVER_DEFAULT_DATA: Array<[string, number, string]> = [
  ['2024/1/1', 10, '主题A'],
  ['2024/1/1', 15, '主题B'],
  ['2024/1/1', 20, '主题C'],
  ['2024/1/2', 12, '主题A'],
  ['2024/1/2', 18, '主题B'],
  ['2024/1/2', 22, '主题C'],
  ['2024/1/3', 8, '主题A'],
  ['2024/1/3', 14, '主题B'],
  ['2024/1/3', 25, '主题C'],
  ['2024/1/4', 15, '主题A'],
  ['2024/1/4', 20, '主题B'],
  ['2024/1/4', 18, '主题C'],
  ['2024/1/5', 20, '主题A'],
  ['2024/1/5', 12, '主题B'],
  ['2024/1/5', 16, '主题C'],
  ['2024/1/6', 18, '主题A'],
  ['2024/1/6', 22, '主题B'],
  ['2024/1/6', 20, '主题C'],
  ['2024/1/7', 25, '主题A'],
  ['2024/1/7', 16, '主题B'],
  ['2024/1/7', 24, '主题C'],
]

export const themeRiverChartDefinition: ComponentDefinition = {
  type: 'theme-river-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.themeRiverChart')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 500,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'boundaryGap',
      get label() {
        return t('editorMaterial.ui.paddingAtBothEnds')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'seriesStyles',
      get label() {
        return t('editorMaterial.ui.itemStyles')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.dataSeries')
      },
      get tip() {
        return t('editorMaterial.ui.configureColorAndLabelVisibilityPerThemeByName')
      },
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    // 🔑 系列标签（主题河流图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    singleAxisDim: THEME_RIVER_DEFAULT_DIM,
    data: THEME_RIVER_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'dateField',
      get label() {
        return t('editorMaterial.ui.dateField')
      },
      type: 'category',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
    },
    {
      key: 'nameField',
      get label() {
        return t('editorMaterial.ui.themeField')
      },
      type: 'name',
    },
  ],
}

export default themeRiverChartDefinition

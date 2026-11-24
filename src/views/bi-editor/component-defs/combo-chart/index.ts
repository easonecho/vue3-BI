import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartBaseSchema,
  baseSeriesStylesWithAxesColumns,
  buildSeriesLabelSchema,
  aggregatePropField,
  topNPropFields,
} from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 双轴组合图默认真实数据 */
export const COMBO_DEFAULT_CATEGORIES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
export const COMBO_DEFAULT_BAR = {
  name: t('editorMaterial.series.sales'),
  data: [120, 200, 150, 80, 70, 110, 130],
}
export const COMBO_DEFAULT_LINE = {
  name: t('editorMaterial.series.growthRate'),
  data: [10, 15, 8, 12, 18, 22, 25],
}

const definition: ComponentDefinition = {
  type: 'combo-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.comboChart')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    aggregatePropField,
    ...topNPropFields,
    {
      key: 'barWidth',
      get label() {
        return t('editorMaterial.ui.barWidth')
      },
      type: 'slider',
      min: 5,
      max: 50,
      default: 20,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'smooth',
      get label() {
        return t('editorMaterial.ui.smoothLine')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'rightAxisPercent',
      get label() {
        return t('editorMaterial.ui.showRightAxisAsPercentage')
      },
      type: 'switch',
      default: true,
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
        return t('editorMaterial.ui.configureColorAndLabelsPerSeriesByName')
      },
      columns: [
        ...baseSeriesStylesWithAxesColumns,
        {
          key: 'lineWidth',
          get label() {
            return t('editorMaterial.ui.lineWidth')
          },
          type: 'number',
          min: 1,
          max: 10,
          width: 80,
        },
        {
          key: 'chartType',
          get label() {
            return t('editorMaterial.ui.chartType')
          },
          type: 'select',
          width: 100,
          options: [
            {
              get label() {
                return t('editorMaterial.ui.bar')
              },
              value: 'bar',
            },
            {
              get label() {
                return t('editorMaterial.ui.line2')
              },
              value: 'line',
            },
          ],
        },
      ],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: COMBO_DEFAULT_CATEGORIES,
    barSeries: COMBO_DEFAULT_BAR,
    lineSeries: COMBO_DEFAULT_LINE,
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
      key: 'barField',
      get label() {
        return t('editorMaterial.ui.barField')
      },
      type: 'value',
    },
    {
      key: 'lineField',
      get label() {
        return t('editorMaterial.ui.lineField')
      },
      type: 'value',
    },
    {
      key: 'drillFields',
      get label() {
        return t('editorMaterial.ui.drillField')
      },
      type: 'category',
      multiple: true,
    },
  ],
}

export default definition

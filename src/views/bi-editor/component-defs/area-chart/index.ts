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

/** 🔑 面积图默认真实数据 */
export const AREA_DEFAULT_CATEGORIES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const AREA_DEFAULT_SERIES = [
  { name: t('editorMaterial.series.revenue'), data: [820, 932, 901, 934, 1290, 1330, 1320] },
  { name: t('editorMaterial.series.expense'), data: [320, 432, 401, 534, 790, 830, 920] },
]

const definition: ComponentDefinition = {
  type: 'area-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.areaChart')
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
      key: 'smooth',
      get label() {
        return t('editorMaterial.ui.smoothCurve')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'areaOpacity',
      get label() {
        return t('editorMaterial.ui.areaOpacity')
      },
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.35,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'stack',
      get label() {
        return t('editorMaterial.ui.stack')
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
        return t('editorMaterial.ui.seriesStyles')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.dataSeries')
      },
      get tip() {
        return t('editorMaterial.ui.configureColorLineWidthAreaAndLabelsPerSeriesByName')
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
          key: 'areaStyle',
          get label() {
            return t('editorMaterial.ui.areaFill')
          },
          type: 'switch',
          width: 100,
        },
      ],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: AREA_DEFAULT_CATEGORIES,
    series: AREA_DEFAULT_SERIES,
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
      key: 'valueFields',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
      multiple: true,
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

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

/** 🔑 折线图默认真实数据 */
export function getLineDefaultCategories(): string[] {
  return [
    t('demoData.weekdays.shortMon'),
    t('demoData.weekdays.shortTue'),
    t('demoData.weekdays.shortWed'),
    t('demoData.weekdays.shortThu'),
    t('demoData.weekdays.shortFri'),
    t('demoData.weekdays.shortSat'),
    t('demoData.weekdays.shortSun'),
  ]
}
export function getLineDefaultSeries() {
  return [
    { name: 'PV', data: [820, 932, 901, 934, 1290, 1330, 1320] },
    { name: 'UV', data: [320, 432, 401, 534, 790, 830, 920] },
  ]
}

export const lineChartDefinition: ComponentDefinition = {
  type: 'line-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.lineChart')
    },
    category: 'chart',
    icon: 'TrendCharts',
    defaultWidth: 400,
    defaultHeight: 300,
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
      key: 'area',
      get label() {
        return t('editorMaterial.ui.areaFill')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'pointSize',
      get label() {
        return t('editorMaterial.ui.pointSize')
      },
      type: 'slider',
      min: 0,
      max: 20,
      default: 6,
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
        return t('editorMaterial.ui.configureColorLineWidthAreaToggleAndLabelsPerSeriesByName')
      },
      // 🔑 基础列（通用：seriesName/color/labelShow） + 折线图特有 lineWidth / areaStyle
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
    // 🔑 系列标签（折线图默认在顶部）
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    get categories() {
      return getLineDefaultCategories()
    },
    get series() {
      return getLineDefaultSeries()
    },
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

export default lineChartDefinition

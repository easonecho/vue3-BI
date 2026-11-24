import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, baseSeriesStylesNoAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 雷达图默认真实数据 */
export const RADAR_DEFAULT_INDICATOR = [
  { name: '销售', max: 6500 },
  { name: '管理', max: 16000 },
  { name: '信息技术', max: 30000 },
  { name: '客服', max: 38000 },
  { name: '研发', max: 52000 },
  { name: '市场', max: 25000 },
]
export const RADAR_DEFAULT_SERIES = [
  { name: '预算分配', value: [4200, 8000, 20000, 28000, 32000, 18000] },
  { name: '实际开销', value: [5000, 9000, 22000, 30000, 35000, 20000] },
]

const definition: ComponentDefinition = {
  type: 'radar-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.radarChart')
    },
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 360,
    defaultHeight: 360,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'shape',
      get label() {
        return t('editorMaterial.ui.shape2')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.polygon')
          },
          value: 'polygon',
        },
        {
          get label() {
            return t('editorMaterial.ui.circle')
          },
          value: 'circle',
        },
      ],
      default: 'polygon',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'splitNumber',
      get label() {
        return t('editorMaterial.ui.segmentCount')
      },
      type: 'slider',
      min: 2,
      max: 10,
      default: 5,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'splitAreaShow',
      get label() {
        return t('editorMaterial.ui.showSplitAreas')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'axisNameShow',
      get label() {
        return t('editorMaterial.ui.showMetricName')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'axisNameColor',
      get label() {
        return t('editorMaterial.ui.metricNameColor')
      },
      type: 'colorpicker',
      default: '#6b7280',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'axisNameFontSize',
      get label() {
        return t('editorMaterial.ui.metricNameFontSize')
      },
      type: 'slider',
      min: 10,
      max: 24,
      default: 12,
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
        return t('editorMaterial.ui.configureColorAndLabelVisibilityPerSeriesByName2')
      },
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    radarIndicator: RADAR_DEFAULT_INDICATOR,
    radarSeries: RADAR_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'nameField',
      get label() {
        return t('editorMaterial.ui.metricNameField')
      },
      type: 'name',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
      multiple: true,
    },
  ],
}

export default definition

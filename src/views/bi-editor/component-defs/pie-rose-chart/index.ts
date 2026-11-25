import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartBaseSchema,
  baseSeriesStylesNoAxesColumns,
  buildSeriesLabelSchema,
  aggregatePropField,
  topNPropFields,
} from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 玫瑰图默认真实数据（[{name, value}, ...]） */
export function getPieRoseDefaultData() {
  return [
    { name: t('demoData.pieRose.categoryA'), value: 40 },
    { name: t('demoData.pieRose.categoryB'), value: 30 },
    { name: t('demoData.pieRose.categoryC'), value: 20 },
    { name: t('demoData.pieRose.categoryD'), value: 15 },
    { name: t('demoData.pieRose.categoryE'), value: 10 },
  ]
}

export const PIE_ROSE_RADIUS_INNER_MIN = 0
export const PIE_ROSE_RADIUS_INNER_MAX = 50
export const PIE_ROSE_RADIUS_INNER_DEFAULT = 10

export const PIE_ROSE_TYPE_OPTIONS = [
  {
    get label() {
      return t('editorMaterial.ui.radiusRose')
    },
    value: 'radius',
  },
  {
    get label() {
      return t('editorMaterial.ui.areaRose')
    },
    value: 'area',
  },
] as const

export const pieRoseChartDefinition: ComponentDefinition = {
  type: 'pie-rose-chart',
  meta: {
    get name() {
      return t('editorMaterial.ui.roseChart')
    },
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 360,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    aggregatePropField,
    ...topNPropFields,
    {
      key: 'roseType',
      get label() {
        return t('editorMaterial.ui.roseMode')
      },
      type: 'select',
      options: [...PIE_ROSE_TYPE_OPTIONS],
      default: 'radius',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'radiusInner',
      get label() {
        return t('editorMaterial.ui.innerRadius')
      },
      type: 'slider',
      min: PIE_ROSE_RADIUS_INNER_MIN,
      max: PIE_ROSE_RADIUS_INNER_MAX,
      default: PIE_ROSE_RADIUS_INNER_DEFAULT,
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
        return t('editorMaterial.ui.configureColorAndLabelVisibilityPerItemByName')
      },
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    // 🔑 系列标签（玫瑰图默认在外部）
    ...buildSeriesLabelSchema('outside'),
  ],
  extraDefaults: {
    get pieData() {
      return getPieRoseDefaultData()
    },
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'nameField',
      get label() {
        return t('editorMaterial.ui.nameField')
      },
      type: 'name',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
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

export default pieRoseChartDefinition

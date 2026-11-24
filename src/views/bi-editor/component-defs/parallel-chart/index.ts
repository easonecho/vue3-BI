import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 平行坐标图默认数据：维度定义 + 多条数据线 */
export const PARALLEL_DEFAULT_DIMENSIONS = [
  { name: 'CPU', max: 100 },
  { name: '内存', max: 100 },
  { name: '磁盘', max: 100 },
  { name: '网络', max: 100 },
  { name: 'QPS', max: 1000 },
]
export const PARALLEL_DEFAULT_DATA = [
  [60, 45, 80, 30, 500],
  [80, 60, 70, 40, 800],
  [70, 55, 75, 35, 650],
  [90, 70, 85, 45, 900],
  [55, 40, 60, 25, 400],
  [75, 65, 80, 50, 750],
]

export const parallelChartDefinition: ComponentDefinition = {
  type: 'parallel-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.parallelChart')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 500,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'lineColor',
      get label() {
        return t('editorMaterial.ui.lineColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.lineColor')
      },
    },
    {
      key: 'lineOpacity',
      get label() {
        return t('editorMaterial.ui.lineOpacity')
      },
      type: 'slider',
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.5,
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.lineOpacity')
      },
    },
    {
      key: 'lineWidth',
      get label() {
        return t('editorMaterial.ui.lineWidth2')
      },
      type: 'slider',
      min: 1,
      max: 5,
      default: 1.5,
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.lineWidth2')
      },
    },
    {
      key: 'axisColor',
      get label() {
        return t('editorMaterial.ui.parallelAxisColor')
      },
      type: 'colorpicker',
      default: '#475569',
      get group() {
        return t('editorMaterial.ui.coordinate')
      },
      get tip() {
        return t('editorMaterial.ui.parallelAxisColor')
      },
    },
    {
      key: 'labelColor',
      get label() {
        return t('editorMaterial.ui.labelColor2')
      },
      type: 'colorpicker',
      default: '#e2e8f0',
      get group() {
        return t('editorMaterial.ui.label')
      },
    },
  ],
  extraDefaults: {
    dimensions: PARALLEL_DEFAULT_DIMENSIONS,
    data: PARALLEL_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'dimensionFields',
      get label() {
        return t('editorMaterial.ui.metricField')
      },
      type: 'value',
      multiple: true,
    },
  ],
}

export default parallelChartDefinition

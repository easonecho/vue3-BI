import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 气泡图默认真实数据：每个数据点 [x, y, size] */
export const BUBBLE_DEFAULT_SERIES = [
  {
    name: t('editorMaterial.series.productA'),
    data: [
      [10, 20, 30],
      [20, 40, 50],
      [30, 30, 40],
      [40, 50, 60],
      [50, 20, 30],
      [15, 35, 45],
      [25, 25, 35],
      [35, 45, 55],
    ],
  },
]

export const bubbleChartDefinition: ComponentDefinition = {
  type: 'bubble-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.bubbleChart')
    },
    category: 'chart',
    icon: 'Aim',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'symbolSizeMin',
      get label() {
        return t('editorMaterial.ui.minBubbleSize')
      },
      type: 'slider',
      min: 5,
      max: 30,
      default: 8,
      get group() {
        return t('editorMaterial.ui.bubble')
      },
      get tip() {
        return t('editorMaterial.ui.minBubbleSize')
      },
    },
    {
      key: 'symbolSizeMax',
      get label() {
        return t('editorMaterial.ui.maxBubbleSize')
      },
      type: 'slider',
      min: 30,
      max: 80,
      default: 50,
      get group() {
        return t('editorMaterial.ui.bubble')
      },
      get tip() {
        return t('editorMaterial.ui.maxBubbleSize')
      },
    },
    {
      key: 'bubbleColor',
      get label() {
        return t('editorMaterial.ui.bubbleMainColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.bubbleMainColor')
      },
    },
    {
      key: 'bubbleColor2',
      get label() {
        return t('editorMaterial.ui.highValueColor')
      },
      type: 'colorpicker',
      default: '#a5f3fc',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.highValueColor')
      },
    },
    {
      key: 'opacity',
      get label() {
        return t('editorMaterial.ui.opacity')
      },
      type: 'slider',
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.7,
      get group() {
        return t('editorMaterial.ui.bubble')
      },
      get tip() {
        return t('editorMaterial.ui.opacity')
      },
    },
  ],
  extraDefaults: {
    series: BUBBLE_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'xField',
      get label() {
        return t('editorMaterial.ui.xAxisField')
      },
      type: 'value',
    },
    {
      key: 'yField',
      get label() {
        return t('editorMaterial.ui.yAxisField')
      },
      type: 'value',
    },
    {
      key: 'sizeField',
      get label() {
        return t('editorMaterial.ui.bubbleSizeField')
      },
      type: 'value',
    },
  ],
}

export default bubbleChartDefinition

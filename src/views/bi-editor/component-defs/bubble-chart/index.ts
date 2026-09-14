import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

/** 气泡图默认真实数据：每个数据点 [x, y, size] */
export const BUBBLE_DEFAULT_SERIES = [
  {
    name: '产品A',
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
    name: '气泡图',
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
      label: '最小气泡大小',
      type: 'slider',
      min: 5,
      max: 30,
      default: 8,
      group: '气泡',
      tip: '最小气泡大小',
    },
    {
      key: 'symbolSizeMax',
      label: '最大气泡大小',
      type: 'slider',
      min: 30,
      max: 80,
      default: 50,
      group: '气泡',
      tip: '最大气泡大小',
    },
    {
      key: 'bubbleColor',
      label: '气泡主色',
      type: 'colorpicker',
      default: '#22d3ee',
      group: '颜色',
      tip: '气泡主色',
    },
    {
      key: 'bubbleColor2',
      label: '高值色',
      type: 'colorpicker',
      default: '#a5f3fc',
      group: '颜色',
      tip: '高值色',
    },
    {
      key: 'opacity',
      label: '透明度',
      type: 'slider',
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.7,
      group: '气泡',
      tip: '透明度',
    },
  ],
  extraDefaults: {
    series: BUBBLE_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default bubbleChartDefinition

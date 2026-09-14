import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

/** 🔑 旭日图默认真实数据（多层级占比下钻） */
export const SUNBURST_DEFAULT_DATA = [
  {
    name: '总公司',
    value: 1000,
    children: [
      {
        name: '华东区',
        value: 380,
        children: [
          { name: '上海', value: 200 },
          { name: '江苏', value: 180 },
        ],
      },
      {
        name: '华南区',
        value: 320,
        children: [
          { name: '广东', value: 200 },
          { name: '福建', value: 120 },
        ],
      },
      {
        name: '华北区',
        value: 300,
        children: [
          { name: '北京', value: 180 },
          { name: '天津', value: 120 },
        ],
      },
    ],
  },
]

export const sunburstChartDefinition: ComponentDefinition = {
  type: 'sunburst-chart',
  meta: {
    name: '旭日图',
    category: 'chart',
    icon: 'Aim',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'innerRadius',
      label: '内圆半径',
      type: 'slider',
      min: 0,
      max: 80,
      default: 30,
      group: '样式',
      tip: '内圆半径(%)',
    },
    {
      key: 'outerRadius',
      label: '外圆半径',
      type: 'slider',
      min: 20,
      max: 100,
      default: 90,
      group: '样式',
      tip: '外圆半径(%)',
    },
    {
      key: 'labelShow',
      label: '显示标签',
      type: 'switch',
      default: true,
      group: '标签',
    },
  ],
  extraDefaults: {
    data: SUNBURST_DEFAULT_DATA,
  },
  defaultStyle: {},
}

export default sunburstChartDefinition

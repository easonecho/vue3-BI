import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

/** 🔑 树图默认真实数据（层级占比） */
export const TREEMAP_DEFAULT_DATA = [
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

export const treemapChartDefinition: ComponentDefinition = {
  type: 'treemap-chart',
  meta: {
    name: '树图',
    category: 'chart',
    icon: 'Grid',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'visualDimension',
      label: '视觉维度',
      type: 'select',
      options: [
        { label: '数值', value: 'value' },
        { label: '名称', value: 'name' },
      ],
      default: 'value',
      group: '视觉',
    },
    {
      key: 'colorFrom',
      label: '颜色范围起始',
      type: 'colorpicker',
      default: '#67e8f9',
      group: '颜色',
      tip: '颜色范围起始',
    },
    {
      key: 'colorTo',
      label: '颜色范围结束',
      type: 'colorpicker',
      default: '#0e7490',
      group: '颜色',
      tip: '颜色范围结束',
    },
    {
      key: 'leafDepth',
      label: '下钻层数',
      type: 'slider',
      min: 1,
      max: 5,
      default: 2,
      group: '交互',
      tip: '下钻到第几层',
    },
  ],
  extraDefaults: {
    data: TREEMAP_DEFAULT_DATA,
  },
  defaultStyle: {},
}

export default treemapChartDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

/**
 * 🔑 真3D柱状图（WebGL 渲染）默认数据
 *   二维网格：X 轴 = 时间类别（Q1-Q4），Y 轴 = 产品类别（A/B/C），Z 轴 = 数值
 */
export const BAR3D_DEFAULT_CATEGORIES = ['Q1', 'Q2', 'Q3', 'Q4']
export const BAR3D_DEFAULT_SERIES = [
  { name: '产品A', data: [320, 280, 360, 400] },
  { name: '产品B', data: [280, 240, 320, 360] },
  { name: '产品C', data: [200, 220, 260, 300] },
]

export const bar3dChartDefinition: ComponentDefinition = {
  type: 'bar3d-chart',
  meta: {
    name: '3D柱状图',
    category: 'chart',
    icon: 'Histogram',
    defaultWidth: 480,
    defaultHeight: 380,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    // 颜色
    {
      key: 'visualOn',
      label: '按数值渐变',
      type: 'switch',
      default: true,
      group: '颜色',
      tip: '开启后柱子按 Z 值从低到高渐变着色',
    },
    {
      key: 'colorLow',
      label: '低值色',
      type: 'colorpicker',
      default: '#67e8f9',
      group: '颜色',
      tip: '数值越低越接近此色',
      visibleWhen: { field: 'visualOn', truthy: true },
    },
    {
      key: 'colorHigh',
      label: '高值色',
      type: 'colorpicker',
      default: '#0e7490',
      group: '颜色',
      tip: '数值越高越接近此色',
      visibleWhen: { field: 'visualOn', truthy: true },
    },
    {
      key: 'barColor',
      label: '柱子色',
      type: 'colorpicker',
      default: '#22d3ee',
      group: '颜色',
      tip: '关闭渐变时的统一柱色',
      visibleWhen: { field: 'visualOn', truthy: false },
    },
    // 视角
    {
      key: 'autoRotate',
      label: '自动旋转',
      type: 'switch',
      default: true,
      group: '视角',
      tip: '相机绕场景自动旋转',
    },
    {
      key: 'rotateSpeed',
      label: '旋转速度',
      type: 'slider',
      min: 0,
      max: 10,
      step: 0.5,
      default: 3,
      group: '视角',
      tip: 'autoRotate=false 时无效',
      visibleWhen: { field: 'autoRotate', truthy: true },
    },
    {
      key: 'viewDistance',
      label: '视距',
      type: 'slider',
      min: 100,
      max: 400,
      default: 220,
      group: '视角',
      tip: '相机与场景距离',
    },
    {
      key: 'elevation',
      label: '俯仰角',
      type: 'slider',
      min: 0,
      max: 90,
      default: 20,
      group: '视角',
      tip: '0=平视，90=俯视',
    },
    // 场景
    {
      key: 'boxWidth',
      label: '场景宽度',
      type: 'slider',
      min: 60,
      max: 200,
      default: 120,
      group: '场景',
      tip: 'X 方向跨度',
    },
    {
      key: 'boxDepth',
      label: '场景深度',
      type: 'slider',
      min: 40,
      max: 150,
      default: 80,
      group: '场景',
      tip: 'Y 方向跨度',
    },
    // 着色
    {
      key: 'shading',
      label: '着色模式',
      type: 'select',
      options: [
        { label: 'Lambert', value: 'lambert' },
        { label: '纯色', value: 'color' },
        { label: '真实感', value: 'realistic' },
      ],
      default: 'lambert',
      group: '着色',
      tip: 'Lambert=漫反射；真实感=金属反光；纯色=无光影',
    },
    // 标签
    {
      key: 'showLabel',
      label: '显示数值',
      type: 'switch',
      default: true,
      group: '标签',
    },
    {
      key: 'labelColor',
      label: '标签色',
      type: 'colorpicker',
      default: '#ffffff',
      group: '标签',
      visibleWhen: { field: 'showLabel', truthy: true },
    },
  ],
  extraDefaults: {
    categories: BAR3D_DEFAULT_CATEGORIES,
    series: BAR3D_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default bar3dChartDefinition

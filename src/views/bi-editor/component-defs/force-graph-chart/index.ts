import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, buildSeriesLabelSchema } from '../types'

/** 🔑 力导向图默认分组：3 个分组（开发/测试/产品） */
export const FORCE_GRAPH_DEFAULT_CATEGORIES = [
  { name: '开发' },
  { name: '测试' },
  { name: '产品' },
]

/** 🔑 力导向图默认节点：8 个节点 */
export const FORCE_GRAPH_DEFAULT_NODES = [
  { name: '前端', category: 0, value: 30 },
  { name: '后端', category: 0, value: 30 },
  { name: '架构师', category: 0, value: 40 },
  { name: '测试工程师', category: 1, value: 25 },
  { name: '自动化测试', category: 1, value: 20 },
  { name: '产品经理', category: 2, value: 35 },
  { name: '交互设计', category: 2, value: 25 },
  { name: 'UI设计', category: 2, value: 25 },
]

/** 🔑 力导向图默认关系（12 条边） */
export const FORCE_GRAPH_DEFAULT_LINKS = [
  { source: '前端', target: '架构师', value: 5 },
  { source: '后端', target: '架构师', value: 5 },
  { source: '前端', target: '后端', value: 3 },
  { source: '前端', target: '产品经理', value: 4 },
  { source: '后端', target: '产品经理', value: 4 },
  { source: '架构师', target: '产品经理', value: 6 },
  { source: '测试工程师', target: '前端', value: 3 },
  { source: '测试工程师', target: '后端', value: 3 },
  { source: '自动化测试', target: '测试工程师', value: 4 },
  { source: '产品经理', target: '交互设计', value: 5 },
  { source: '交互设计', target: 'UI设计', value: 5 },
  { source: '产品经理', target: 'UI设计', value: 3 },
]

export const FORCE_GRAPH_DEFAULT_LAYOUT = 'force'
export const FORCE_GRAPH_DEFAULT_SYMBOL_SIZE = 20
export const FORCE_GRAPH_DEFAULT_EDGE_LENGTH = 100
export const FORCE_GRAPH_DEFAULT_REPULSION = 200
export const FORCE_GRAPH_DEFAULT_GRAVITY = 0.1
export const FORCE_GRAPH_DEFAULT_NODE_COLOR = '#5470c6'
export const FORCE_GRAPH_DEFAULT_EDGE_COLOR = '#a3a3a3'

export const forceGraphChartDefinition: ComponentDefinition = {
  type: 'force-graph-chart',
  meta: {
    name: '力导向图',
    category: 'chart',
    icon: 'Share',
    defaultWidth: 500,
    defaultHeight: 400,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'layout',
      label: '布局方式',
      type: 'select',
      options: [
        { label: '力导向', value: 'force' },
        { label: '圆形', value: 'circular' },
        { label: '固定位置', value: 'none' },
      ],
      default: FORCE_GRAPH_DEFAULT_LAYOUT,
      group: '布局',
    },
    {
      key: 'symbolSize',
      label: '节点大小',
      type: 'slider',
      min: 10,
      max: 50,
      default: FORCE_GRAPH_DEFAULT_SYMBOL_SIZE,
      group: '节点',
    },
    {
      key: 'edgeLength',
      label: '边长度',
      type: 'slider',
      min: 50,
      max: 300,
      default: FORCE_GRAPH_DEFAULT_EDGE_LENGTH,
      group: '力导向',
      visibleWhen: { field: 'layout', equals: 'force' },
    },
    {
      key: 'repulsion',
      label: '斥力',
      type: 'slider',
      min: 50,
      max: 500,
      default: FORCE_GRAPH_DEFAULT_REPULSION,
      group: '力导向',
      visibleWhen: { field: 'layout', equals: 'force' },
    },
    {
      key: 'gravity',
      label: '引力',
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.05,
      default: FORCE_GRAPH_DEFAULT_GRAVITY,
      group: '力导向',
      visibleWhen: { field: 'layout', equals: 'force' },
    },
    { key: 'draggable', label: '节点拖拽', type: 'switch', default: true, group: '交互' },
    {
      key: 'showEdgeLabel',
      label: '显示边标签',
      type: 'switch',
      default: false,
      group: '交互',
    },
    {
      key: 'nodeColor',
      label: '节点颜色',
      type: 'colorpicker',
      default: FORCE_GRAPH_DEFAULT_NODE_COLOR,
      group: '颜色',
    },
    {
      key: 'edgeColor',
      label: '连线颜色',
      type: 'colorpicker',
      default: FORCE_GRAPH_DEFAULT_EDGE_COLOR,
      group: '颜色',
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    categories: FORCE_GRAPH_DEFAULT_CATEGORIES,
    nodes: FORCE_GRAPH_DEFAULT_NODES,
    links: FORCE_GRAPH_DEFAULT_LINKS,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'sourceField', label: '源节点', type: 'name' },
    { key: 'targetField', label: '目标节点', type: 'name' },
    { key: 'valueField', label: '关系强度', type: 'value' },
  ],
}

export default forceGraphChartDefinition

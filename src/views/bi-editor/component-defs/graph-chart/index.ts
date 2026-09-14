import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

/** 🔑 关系图默认分类 */
export const GRAPH_DEFAULT_CATEGORIES = [
  { name: '核心' },
  { name: '上游' },
  { name: '下游' },
]

/** 🔑 关系图默认节点（关联网络） */
export const GRAPH_DEFAULT_NODES = [
  { name: '公司', category: 0, value: 30, symbolSize: 40 },
  { name: '供应商A', category: 1, value: 20, symbolSize: 30 },
  { name: '供应商B', category: 1, value: 15, symbolSize: 25 },
  { name: '客户A', category: 2, value: 20, symbolSize: 30 },
  { name: '客户B', category: 2, value: 15, symbolSize: 25 },
  { name: '合作伙伴', category: 2, value: 10, symbolSize: 20 },
]

/** 🔑 关系图默认连线（拓扑关系） */
export const GRAPH_DEFAULT_LINKS = [
  { source: '供应商A', target: '公司' },
  { source: '供应商B', target: '公司' },
  { source: '公司', target: '客户A' },
  { source: '公司', target: '客户B' },
  { source: '合作伙伴', target: '公司' },
]

export const graphChartDefinition: ComponentDefinition = {
  type: 'graph-chart',
  meta: {
    name: '关系图',
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
      default: 'force',
      group: '布局',
    },
    {
      key: 'draggable',
      label: '节点拖拽',
      type: 'switch',
      default: false,
      group: '交互',
      tip: '节点可拖拽调整位置（编辑模式下建议关闭，否则拖拽会同时拖节点和移动组件）',
    },
    {
      key: 'nodeSize',
      label: '节点大小',
      type: 'slider',
      min: 5,
      max: 50,
      default: 20,
      group: '节点',
    },
    {
      key: 'linkColor',
      label: '连线颜色',
      type: 'colorpicker',
      default: '#475569',
      group: '连线',
    },
  ],
  extraDefaults: {
    categories: GRAPH_DEFAULT_CATEGORIES,
    nodes: GRAPH_DEFAULT_NODES,
    links: GRAPH_DEFAULT_LINKS,
  },
  defaultStyle: {},
}

export default graphChartDefinition

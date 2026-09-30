import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, buildSeriesLabelSchema } from '../types'

/** 🔑 树图默认数据：3 层组织架构（CEO → 3 个部门 → 各 2 个小组） */
export const TREE_DEFAULT_DATA = {
  name: 'CEO',
  children: [
    {
      name: '研发部',
      children: [{ name: '前端组' }, { name: '后端组' }],
    },
    {
      name: '产品部',
      children: [{ name: '设计组' }, { name: '产品组' }],
    },
    {
      name: '运营部',
      children: [{ name: '推广组' }, { name: '内容组' }],
    },
  ],
}

export const TREE_DEFAULT_LAYOUT = 'orthogonal'
export const TREE_DEFAULT_ORIENT = 'LR'
export const TREE_DEFAULT_SYMBOL = 'emptyCircle'
export const TREE_DEFAULT_SYMBOL_SIZE = 8
export const TREE_DEFAULT_LINE_STYLE = 'curve'
export const TREE_DEFAULT_NODE_COLOR = '#5470c6'
export const TREE_DEFAULT_LINE_COLOR = '#a3a3a3'

export const treeChartDefinition: ComponentDefinition = {
  type: 'tree-chart',
  meta: {
    name: '树图',
    category: 'chart',
    icon: 'Connection',
    defaultWidth: 400,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'layout',
      label: '布局方式',
      type: 'select',
      options: [
        { label: '正交布局', value: 'orthogonal' },
        { label: '径向布局', value: 'radial' },
      ],
      default: TREE_DEFAULT_LAYOUT,
      group: '布局',
    },
    {
      key: 'orient',
      label: '方向',
      type: 'select',
      options: [
        { label: '从左到右', value: 'LR' },
        { label: '从上到下', value: 'TB' },
        { label: '从右到左', value: 'RL' },
        { label: '从下到上', value: 'BT' },
      ],
      default: TREE_DEFAULT_ORIENT,
      group: '布局',
      visibleWhen: { field: 'layout', equals: 'orthogonal' },
    },
    {
      key: 'symbol',
      label: '节点形状',
      type: 'select',
      options: [
        { label: '空心圆', value: 'emptyCircle' },
        { label: '实心圆', value: 'circle' },
        { label: '矩形', value: 'rect' },
        { label: '圆角矩形', value: 'roundRect' },
        { label: '三角形', value: 'triangle' },
      ],
      default: TREE_DEFAULT_SYMBOL,
      group: '节点',
    },
    {
      key: 'symbolSize',
      label: '节点大小',
      type: 'slider',
      min: 4,
      max: 30,
      default: TREE_DEFAULT_SYMBOL_SIZE,
      group: '节点',
    },
    {
      key: 'lineStyle',
      label: '连线样式',
      type: 'select',
      options: [
        { label: '曲线', value: 'curve' },
        { label: '折线', value: 'polyline' },
      ],
      default: TREE_DEFAULT_LINE_STYLE,
      group: '连线',
    },
    { key: 'expandAll', label: '默认展开全部', type: 'switch', default: true, group: '交互' },
    {
      key: 'initialLevel',
      label: '初始展开层级',
      type: 'number',
      default: 2,
      group: '交互',
      visibleWhen: { field: 'expandAll', truthy: false },
    },
    {
      key: 'nodeColor',
      label: '节点颜色',
      type: 'colorpicker',
      default: TREE_DEFAULT_NODE_COLOR,
      group: '颜色',
    },
    {
      key: 'lineColor',
      label: '连线颜色',
      type: 'colorpicker',
      default: TREE_DEFAULT_LINE_COLOR,
      group: '颜色',
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    treeData: TREE_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [{ key: 'treeField', label: '树结构字段', type: 'name' }],
}

export default treeChartDefinition

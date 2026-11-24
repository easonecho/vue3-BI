import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 力导向图默认分组：3 个分组（开发/测试/产品） */
export const FORCE_GRAPH_DEFAULT_CATEGORIES = [{ name: '开发' }, { name: '测试' }, { name: '产品' }]

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
    get name() {
      return t('editorMaterial.meta.forceGraph')
    },
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
      get label() {
        return t('editorMaterial.ui.layoutMode')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.forceDirected')
          },
          value: 'force',
        },
        {
          get label() {
            return t('editorMaterial.ui.circle')
          },
          value: 'circular',
        },
        {
          get label() {
            return t('editorMaterial.ui.fixedPosition')
          },
          value: 'none',
        },
      ],
      default: FORCE_GRAPH_DEFAULT_LAYOUT,
      get group() {
        return t('editorMaterial.ui.layout')
      },
    },
    {
      key: 'symbolSize',
      get label() {
        return t('editorMaterial.ui.nodeSize')
      },
      type: 'slider',
      min: 10,
      max: 50,
      default: FORCE_GRAPH_DEFAULT_SYMBOL_SIZE,
      get group() {
        return t('editorMaterial.ui.node')
      },
    },
    {
      key: 'edgeLength',
      get label() {
        return t('editorMaterial.ui.edgeLength')
      },
      type: 'slider',
      min: 50,
      max: 300,
      default: FORCE_GRAPH_DEFAULT_EDGE_LENGTH,
      get group() {
        return t('editorMaterial.ui.forceDirected')
      },
      visibleWhen: { field: 'layout', equals: 'force' },
    },
    {
      key: 'repulsion',
      get label() {
        return t('editorMaterial.ui.repulsion')
      },
      type: 'slider',
      min: 50,
      max: 500,
      default: FORCE_GRAPH_DEFAULT_REPULSION,
      get group() {
        return t('editorMaterial.ui.forceDirected')
      },
      visibleWhen: { field: 'layout', equals: 'force' },
    },
    {
      key: 'gravity',
      get label() {
        return t('editorMaterial.ui.gravity')
      },
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.05,
      default: FORCE_GRAPH_DEFAULT_GRAVITY,
      get group() {
        return t('editorMaterial.ui.forceDirected')
      },
      visibleWhen: { field: 'layout', equals: 'force' },
    },
    {
      key: 'draggable',
      get label() {
        return t('editorMaterial.ui.nodeDragging')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
    },
    {
      key: 'showEdgeLabel',
      get label() {
        return t('editorMaterial.ui.showEdgeLabels')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
    },
    {
      key: 'nodeColor',
      get label() {
        return t('editorMaterial.ui.nodeColor')
      },
      type: 'colorpicker',
      default: FORCE_GRAPH_DEFAULT_NODE_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'edgeColor',
      get label() {
        return t('editorMaterial.ui.linkColor')
      },
      type: 'colorpicker',
      default: FORCE_GRAPH_DEFAULT_EDGE_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
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
    {
      key: 'sourceField',
      get label() {
        return t('editorMaterial.ui.sourceNode')
      },
      type: 'name',
    },
    {
      key: 'targetField',
      get label() {
        return t('editorMaterial.ui.targetNode')
      },
      type: 'name',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.linkStrength')
      },
      type: 'value',
    },
  ],
}

export default forceGraphChartDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 关系图默认分类 */
export const GRAPH_DEFAULT_CATEGORIES = [{ name: '核心' }, { name: '上游' }, { name: '下游' }]

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
    get name() {
      return t('editorMaterial.meta.graphChart')
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
      default: 'force',
      get group() {
        return t('editorMaterial.ui.layout')
      },
    },
    {
      key: 'draggable',
      get label() {
        return t('editorMaterial.ui.nodeDragging')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
      get tip() {
        return t(
          'editorMaterial.ui.nodesCanBeDraggedToRepositionDisableInEditModeOtherwiseDraggingMovesBothNodeAndComponent',
        )
      },
    },
    {
      key: 'nodeSize',
      get label() {
        return t('editorMaterial.ui.nodeSize')
      },
      type: 'slider',
      min: 5,
      max: 50,
      default: 20,
      get group() {
        return t('editorMaterial.ui.node')
      },
    },
    {
      key: 'linkColor',
      get label() {
        return t('editorMaterial.ui.linkColor')
      },
      type: 'colorpicker',
      default: '#475569',
      get group() {
        return t('editorMaterial.ui.linkLine')
      },
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

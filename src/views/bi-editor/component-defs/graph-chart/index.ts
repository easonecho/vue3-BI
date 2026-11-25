import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 关系图默认分类/节点/连线（名称共用同一套本地化文案） */
export function getGraphDefaultData() {
  const core = t('demoData.graph.core')
  const upstream = t('demoData.graph.upstream')
  const downstream = t('demoData.graph.downstream')
  const company = t('demoData.graph.company')
  const supplierA = t('demoData.graph.supplierA')
  const supplierB = t('demoData.graph.supplierB')
  const customerA = t('demoData.graph.customerA')
  const customerB = t('demoData.graph.customerB')
  const partner = t('demoData.graph.partner')
  return {
    categories: [{ name: core }, { name: upstream }, { name: downstream }],
    nodes: [
      { name: company, category: 0, value: 30, symbolSize: 40 },
      { name: supplierA, category: 1, value: 20, symbolSize: 30 },
      { name: supplierB, category: 1, value: 15, symbolSize: 25 },
      { name: customerA, category: 2, value: 20, symbolSize: 30 },
      { name: customerB, category: 2, value: 15, symbolSize: 25 },
      { name: partner, category: 2, value: 10, symbolSize: 20 },
    ],
    links: [
      { source: supplierA, target: company },
      { source: supplierB, target: company },
      { source: company, target: customerA },
      { source: company, target: customerB },
      { source: partner, target: company },
    ],
  }
}

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
    get categories() {
      return getGraphDefaultData().categories
    },
    get nodes() {
      return getGraphDefaultData().nodes
    },
    get links() {
      return getGraphDefaultData().links
    },
  },
  defaultStyle: {},
}

export default graphChartDefinition

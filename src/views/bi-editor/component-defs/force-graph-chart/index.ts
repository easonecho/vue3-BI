import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 力导向图默认分组/节点/关系（名称共用同一套本地化文案） */
export function getForceGraphDefaultData() {
  const dev = t('demoData.forceGraph.dev')
  const test = t('demoData.forceGraph.test')
  const product = t('demoData.forceGraph.product')
  const frontend = t('demoData.forceGraph.frontend')
  const backend = t('demoData.forceGraph.backend')
  const architect = t('demoData.forceGraph.architect')
  const testEngineer = t('demoData.forceGraph.testEngineer')
  const automationTest = t('demoData.forceGraph.automationTest')
  const productManager = t('demoData.forceGraph.productManager')
  const interactionDesign = t('demoData.forceGraph.interactionDesign')
  const uiDesign = t('demoData.forceGraph.uiDesign')
  return {
    categories: [{ name: dev }, { name: test }, { name: product }],
    nodes: [
      { name: frontend, category: 0, value: 30 },
      { name: backend, category: 0, value: 30 },
      { name: architect, category: 0, value: 40 },
      { name: testEngineer, category: 1, value: 25 },
      { name: automationTest, category: 1, value: 20 },
      { name: productManager, category: 2, value: 35 },
      { name: interactionDesign, category: 2, value: 25 },
      { name: uiDesign, category: 2, value: 25 },
    ],
    links: [
      { source: frontend, target: architect, value: 5 },
      { source: backend, target: architect, value: 5 },
      { source: frontend, target: backend, value: 3 },
      { source: frontend, target: productManager, value: 4 },
      { source: backend, target: productManager, value: 4 },
      { source: architect, target: productManager, value: 6 },
      { source: testEngineer, target: frontend, value: 3 },
      { source: testEngineer, target: backend, value: 3 },
      { source: automationTest, target: testEngineer, value: 4 },
      { source: productManager, target: interactionDesign, value: 5 },
      { source: interactionDesign, target: uiDesign, value: 5 },
      { source: productManager, target: uiDesign, value: 3 },
    ],
  }
}

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
    get categories() {
      return getForceGraphDefaultData().categories
    },
    get nodes() {
      return getForceGraphDefaultData().nodes
    },
    get links() {
      return getForceGraphDefaultData().links
    },
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

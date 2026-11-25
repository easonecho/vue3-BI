import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 树图默认数据：3 层组织架构（CEO → 3 个部门 → 各 2 个小组） */
export function getTreeDefaultData() {
  return {
    name: 'CEO',
    children: [
      {
        name: t('demoData.tree.rnd'),
        children: [
          { name: t('demoData.tree.frontendTeam') },
          { name: t('demoData.tree.backendTeam') },
        ],
      },
      {
        name: t('demoData.tree.product'),
        children: [
          { name: t('demoData.tree.designTeam') },
          { name: t('demoData.tree.productTeam') },
        ],
      },
      {
        name: t('demoData.tree.ops'),
        children: [
          { name: t('demoData.tree.promotionTeam') },
          { name: t('demoData.tree.contentTeam') },
        ],
      },
    ],
  }
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
    get name() {
      return t('editorMaterial.meta.treeChart')
    },
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
      get label() {
        return t('editorMaterial.ui.layoutMode')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.orthogonalLayout')
          },
          value: 'orthogonal',
        },
        {
          get label() {
            return t('editorMaterial.ui.radialLayout')
          },
          value: 'radial',
        },
      ],
      default: TREE_DEFAULT_LAYOUT,
      get group() {
        return t('editorMaterial.ui.layout')
      },
    },
    {
      key: 'orient',
      get label() {
        return t('editorMaterial.ui.direction')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.leftToRight')
          },
          value: 'LR',
        },
        {
          get label() {
            return t('editorMaterial.ui.topToBottom')
          },
          value: 'TB',
        },
        {
          get label() {
            return t('editorMaterial.ui.rightToLeft')
          },
          value: 'RL',
        },
        {
          get label() {
            return t('editorMaterial.ui.bottomToTop')
          },
          value: 'BT',
        },
      ],
      default: TREE_DEFAULT_ORIENT,
      get group() {
        return t('editorMaterial.ui.layout')
      },
      visibleWhen: { field: 'layout', equals: 'orthogonal' },
    },
    {
      key: 'symbol',
      get label() {
        return t('editorMaterial.ui.nodeShape')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.hollowCircle')
          },
          value: 'emptyCircle',
        },
        {
          get label() {
            return t('editorMaterial.ui.solidCircle')
          },
          value: 'circle',
        },
        {
          get label() {
            return t('editorMaterial.ui.rectangle')
          },
          value: 'rect',
        },
        {
          get label() {
            return t('editorMaterial.ui.roundedRectangle')
          },
          value: 'roundRect',
        },
        {
          get label() {
            return t('editorMaterial.ui.triangle2')
          },
          value: 'triangle',
        },
      ],
      default: TREE_DEFAULT_SYMBOL,
      get group() {
        return t('editorMaterial.ui.node')
      },
    },
    {
      key: 'symbolSize',
      get label() {
        return t('editorMaterial.ui.nodeSize')
      },
      type: 'slider',
      min: 4,
      max: 30,
      default: TREE_DEFAULT_SYMBOL_SIZE,
      get group() {
        return t('editorMaterial.ui.node')
      },
    },
    {
      key: 'lineStyle',
      get label() {
        return t('editorMaterial.ui.linkStyle')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.curve')
          },
          value: 'curve',
        },
        {
          get label() {
            return t('editorMaterial.ui.line2')
          },
          value: 'polyline',
        },
      ],
      default: TREE_DEFAULT_LINE_STYLE,
      get group() {
        return t('editorMaterial.ui.linkLine')
      },
    },
    {
      key: 'expandAll',
      get label() {
        return t('editorMaterial.ui.expandAllByDefault')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
    },
    {
      key: 'initialLevel',
      get label() {
        return t('editorMaterial.ui.initialExpandLevel')
      },
      type: 'number',
      default: 2,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
      visibleWhen: { field: 'expandAll', truthy: false },
    },
    {
      key: 'nodeColor',
      get label() {
        return t('editorMaterial.ui.nodeColor')
      },
      type: 'colorpicker',
      default: TREE_DEFAULT_NODE_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'lineColor',
      get label() {
        return t('editorMaterial.ui.linkColor')
      },
      type: 'colorpicker',
      default: TREE_DEFAULT_LINE_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    get treeData() {
      return getTreeDefaultData()
    },
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'treeField',
      get label() {
        return t('editorMaterial.ui.treeStructureField')
      },
      type: 'name',
    },
  ],
}

export default treeChartDefinition

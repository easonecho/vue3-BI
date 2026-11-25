import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, aggregatePropField, topNPropFields } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 桑基图默认真实数据（节点 + 流向，节点名与连线共用同一套本地化文案） */
export function getSankeyDefaultData() {
  const revenue = t('editorMaterial.series.revenue')
  const expense = t('editorMaterial.series.expense')
  const salary = t('demoData.sankey.salary')
  const bonus = t('demoData.sankey.bonus')
  const rent = t('demoData.sankey.rent')
  const dining = t('demoData.sankey.dining')
  const savings = t('demoData.sankey.savings')
  const other = t('demoData.sankey.other')
  return {
    nodes: [
      { name: revenue },
      { name: expense },
      { name: salary, value: 8000 },
      { name: bonus, value: 3000 },
      { name: rent, value: 3000 },
      { name: dining, value: 2000 },
      { name: savings, value: 4000 },
      { name: other, value: 2000 },
    ],
    links: [
      { source: salary, target: revenue, value: 8000 },
      { source: bonus, target: revenue, value: 3000 },
      { source: revenue, target: expense, value: 5000 },
      { source: revenue, target: savings, value: 4000 },
      { source: revenue, target: other, value: 2000 },
      { source: expense, target: rent, value: 3000 },
      { source: expense, target: dining, value: 2000 },
    ],
  }
}

export const sankeyChartDefinition: ComponentDefinition = {
  type: 'sankey-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.sankeyChart')
    },
    category: 'chart',
    icon: 'Connection',
    defaultWidth: 500,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    aggregatePropField,
    ...topNPropFields,
    {
      key: 'nodeWidth',
      get label() {
        return t('editorMaterial.ui.nodeWidth')
      },
      type: 'slider',
      min: 5,
      max: 30,
      default: 15,
      get group() {
        return t('editorMaterial.ui.node')
      },
    },
    {
      key: 'nodeGap',
      get label() {
        return t('editorMaterial.ui.nodeGap')
      },
      type: 'slider',
      min: 2,
      max: 30,
      default: 10,
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
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.linkLine')
      },
    },
    {
      key: 'linkOpacity',
      get label() {
        return t('editorMaterial.ui.linkOpacity')
      },
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      get group() {
        return t('editorMaterial.ui.linkLine')
      },
    },
  ],
  extraDefaults: {
    get nodes() {
      return getSankeyDefaultData().nodes
    },
    get links() {
      return getSankeyDefaultData().links
    },
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'sourceField',
      get label() {
        return t('editorMaterial.ui.sourceField')
      },
      type: 'category',
    },
    {
      key: 'targetField',
      get label() {
        return t('editorMaterial.ui.targetField')
      },
      type: 'category',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
    },
  ],
}

export default sankeyChartDefinition

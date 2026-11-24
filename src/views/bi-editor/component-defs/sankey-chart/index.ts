import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, aggregatePropField, topNPropFields } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 桑基图默认真实数据（节点 + 流向） */
export const SANKEY_DEFAULT_NODES = [
  { name: t('editorMaterial.series.revenue') },
  { name: t('editorMaterial.series.expense') },
  { name: '工资', value: 8000 },
  { name: '奖金', value: 3000 },
  { name: '房租', value: 3000 },
  { name: '餐饮', value: 2000 },
  { name: '储蓄', value: 4000 },
  { name: '其他', value: 2000 },
]

export const SANKEY_DEFAULT_LINKS = [
  { source: '工资', target: '收入', value: 8000 },
  { source: '奖金', target: '收入', value: 3000 },
  { source: '收入', target: '支出', value: 5000 },
  { source: '收入', target: '储蓄', value: 4000 },
  { source: '收入', target: '其他', value: 2000 },
  { source: '支出', target: '房租', value: 3000 },
  { source: '支出', target: '餐饮', value: 2000 },
]

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
    nodes: SANKEY_DEFAULT_NODES,
    links: SANKEY_DEFAULT_LINKS,
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

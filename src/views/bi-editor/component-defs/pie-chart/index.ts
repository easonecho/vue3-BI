import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartCommonSchema,
  baseSeriesStylesNoAxesColumns,
  buildSeriesLabelSchema,
  aggregatePropField,
  topNPropFields,
} from '../types' // 饼图没有 X/Y 轴，只引入通用 Schema（title/legend/tooltip/animation）

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 饼图默认真实数据（[{name, value}, ...]） */
export const PIE_DEFAULT_DATA = [
  { name: '直接访问', value: 335 },
  { name: '搜索引擎', value: 310 },
  { name: '邮件营销', value: 234 },
  { name: '联盟广告', value: 135 },
  { name: '视频广告', value: 1548 },
]

export const pieChartDefinition: ComponentDefinition = {
  type: 'pie-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.pieChart')
    },
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 300,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    aggregatePropField,
    ...topNPropFields,
    {
      key: 'radius',
      get label() {
        return t('editorMaterial.ui.outerRadius')
      },
      type: 'slider',
      min: 20,
      max: 80,
      default: 55,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'rose',
      get label() {
        return t('editorMaterial.ui.roseChart')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'donut',
      get label() {
        return t('editorMaterial.ui.donut')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'innerRadius',
      get label() {
        return t('editorMaterial.ui.innerRadius')
      },
      type: 'slider',
      min: 5,
      max: 70,
      default: 35,
      get group() {
        return t('editorMaterial.ui.style')
      },
      visibleWhen: { field: 'donut', truthy: true },
    },
    {
      key: 'seriesStyles',
      get label() {
        return t('editorMaterial.ui.itemStyles')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.dataSeries')
      },
      get tip() {
        return t('editorMaterial.ui.configureColorAndLabelVisibilityPerPieItemByName')
      },
      // 🔑 无坐标轴通用列：name/color/labelShow（饼图目前没有特殊列，直接用基础）
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    // 🔑 系列标签（饼图默认在外部，位置可切换：饼图只有 outside/inside/center 三种，位置在饼图自身 label.position 里控制）
    ...buildSeriesLabelSchema('outside'),
  ],
  extraDefaults: {
    pieData: PIE_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'nameField',
      get label() {
        return t('editorMaterial.ui.nameField')
      },
      type: 'name',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
    },
    {
      key: 'drillFields',
      get label() {
        return t('editorMaterial.ui.drillField')
      },
      type: 'category',
      multiple: true,
    },
  ],
}

export default pieChartDefinition

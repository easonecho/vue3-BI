import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, aggregatePropField, topNPropFields } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 树图默认真实数据（层级占比） */
export function getTreemapDefaultData() {
  return [
    {
      name: t('demoData.hierarchy.hq'),
      value: 1000,
      children: [
        {
          name: t('demoData.hierarchy.eastChina'),
          value: 380,
          children: [
            { name: t('demoData.hierarchy.shanghai'), value: 200 },
            { name: t('demoData.hierarchy.jiangsu'), value: 180 },
          ],
        },
        {
          name: t('demoData.hierarchy.southChina'),
          value: 320,
          children: [
            { name: t('demoData.hierarchy.guangdong'), value: 200 },
            { name: t('demoData.hierarchy.fujian'), value: 120 },
          ],
        },
        {
          name: t('demoData.hierarchy.northChina'),
          value: 300,
          children: [
            { name: t('demoData.hierarchy.beijing'), value: 180 },
            { name: t('demoData.hierarchy.tianjin'), value: 120 },
          ],
        },
      ],
    },
  ]
}

export const treemapChartDefinition: ComponentDefinition = {
  type: 'treemap-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.treeChart')
    },
    category: 'chart',
    icon: 'Grid',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    aggregatePropField,
    ...topNPropFields,
    {
      key: 'visualDimension',
      get label() {
        return t('editorMaterial.ui.visualDimension')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.value')
          },
          value: 'value',
        },
        {
          get label() {
            return t('editorMaterial.ui.name')
          },
          value: 'name',
        },
      ],
      default: 'value',
      get group() {
        return t('editorMaterial.ui.visual')
      },
    },
    {
      key: 'colorFrom',
      get label() {
        return t('editorMaterial.ui.colorRangeStart')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.colorRangeStart')
      },
    },
    {
      key: 'colorTo',
      get label() {
        return t('editorMaterial.ui.colorRangeEnd')
      },
      type: 'colorpicker',
      default: '#0e7490',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.colorRangeEnd')
      },
    },
    {
      key: 'leafDepth',
      get label() {
        return t('editorMaterial.ui.drillLevels')
      },
      type: 'slider',
      min: 1,
      max: 5,
      default: 2,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
      get tip() {
        return t('editorMaterial.ui.drillToLevel')
      },
    },
  ],
  extraDefaults: {
    get data() {
      return getTreemapDefaultData()
    },
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'categoryField',
      get label() {
        return t('editorMaterial.ui.categoryField')
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

export default treemapChartDefinition

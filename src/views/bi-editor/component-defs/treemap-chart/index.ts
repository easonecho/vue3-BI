import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, aggregatePropField, topNPropFields } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 树图默认真实数据（层级占比） */
export const TREEMAP_DEFAULT_DATA = [
  {
    name: '总公司',
    value: 1000,
    children: [
      {
        name: '华东区',
        value: 380,
        children: [
          { name: '上海', value: 200 },
          { name: '江苏', value: 180 },
        ],
      },
      {
        name: '华南区',
        value: 320,
        children: [
          { name: '广东', value: 200 },
          { name: '福建', value: 120 },
        ],
      },
      {
        name: '华北区',
        value: 300,
        children: [
          { name: '北京', value: 180 },
          { name: '天津', value: 120 },
        ],
      },
    ],
  },
]

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
    data: TREEMAP_DEFAULT_DATA,
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

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 旭日图默认真实数据（多层级占比下钻） */
export const SUNBURST_DEFAULT_DATA = [
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

export const sunburstChartDefinition: ComponentDefinition = {
  type: 'sunburst-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.sunburstChart')
    },
    category: 'chart',
    icon: 'Aim',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'innerRadius',
      get label() {
        return t('editorMaterial.ui.innerRadius2')
      },
      type: 'slider',
      min: 0,
      max: 80,
      default: 30,
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.innerRadius3')
      },
    },
    {
      key: 'outerRadius',
      get label() {
        return t('editorMaterial.ui.outerRadius2')
      },
      type: 'slider',
      min: 20,
      max: 100,
      default: 90,
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.outerRadius3')
      },
    },
    {
      key: 'labelShow',
      get label() {
        return t('editorMaterial.ui.showLabel')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.label')
      },
    },
  ],
  extraDefaults: {
    data: SUNBURST_DEFAULT_DATA,
  },
  defaultStyle: {},
}

export default sunburstChartDefinition

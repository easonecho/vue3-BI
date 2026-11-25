import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 旭日图默认真实数据（多层级占比下钻） */
export function getSunburstDefaultData() {
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
    get data() {
      return getSunburstDefaultData()
    },
  },
  defaultStyle: {},
}

export default sunburstChartDefinition

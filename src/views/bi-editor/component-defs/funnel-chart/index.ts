import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema, baseSeriesStylesNoAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 漏斗图默认真实数据 */
export function getFunnelDefaultData() {
  return [
    { name: t('demoData.funnel.impression'), value: 900 },
    { name: t('demoData.funnel.click'), value: 600 },
    { name: t('demoData.funnel.visit'), value: 380 },
    { name: t('demoData.funnel.consult'), value: 220 },
    { name: t('demoData.funnel.order'), value: 120 },
    { name: t('demoData.funnel.deal'), value: 60 },
  ]
}

const definition: ComponentDefinition = {
  type: 'funnel-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.funnelChart')
    },
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 360,
    defaultHeight: 360,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'sort',
      get label() {
        return t('editorMaterial.ui.sortMode')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.descending2')
          },
          value: 'descending',
        },
        {
          get label() {
            return t('editorMaterial.ui.ascending2')
          },
          value: 'ascending',
        },
        {
          get label() {
            return t('editorMaterial.ui.byDataOrder')
          },
          value: 'none',
        },
      ],
      default: 'descending',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'funnelAlign',
      get label() {
        return t('editorMaterial.ui.alignment')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.center')
          },
          value: 'center',
        },
        {
          get label() {
            return t('editorMaterial.ui.leftAlign')
          },
          value: 'left',
        },
        {
          get label() {
            return t('editorMaterial.ui.rightAlign')
          },
          value: 'right',
        },
      ],
      default: 'center',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'minSize',
      get label() {
        return t('editorMaterial.ui.minWidth')
      },
      type: 'slider',
      min: 0,
      max: 100,
      default: 0,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'maxSize',
      get label() {
        return t('editorMaterial.ui.maxWidth')
      },
      type: 'slider',
      min: 10,
      max: 100,
      default: 100,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'gap',
      get label() {
        return t('editorMaterial.ui.gapPx')
      },
      type: 'slider',
      min: 0,
      max: 30,
      default: 2,
      get group() {
        return t('editorMaterial.ui.style')
      },
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
        return t('editorMaterial.ui.configureColorAndLabelVisibilityPerFunnelItemByName')
      },
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    ...buildSeriesLabelSchema('inside'),
  ],
  extraDefaults: {
    get funnelData() {
      return getFunnelDefaultData()
    },
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
  ],
}

export default definition

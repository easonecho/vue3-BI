import { defineAsyncComponent } from 'vue'
import { aggregatePropField, type ComponentDefinition } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const gaugeDefinition: ComponentDefinition = {
  type: 'gauge',
  meta: {
    get name() {
      return t('editorMaterial.meta.gauge')
    },
    category: 'info',
    icon: 'Odometer',
    defaultWidth: 200,
    defaultHeight: 200,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    {
      key: 'value',
      get label() {
        return t('editorMaterial.ui.currentValue')
      },
      type: 'slider',
      min: 0,
      max: 100,
      default: 50,
    },
    {
      key: 'max',
      get label() {
        return t('editorMaterial.ui.max')
      },
      type: 'number',
      default: 100,
    },
    {
      key: 'min',
      get label() {
        return t('editorMaterial.ui.min')
      },
      type: 'number',
      default: 0,
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.color')
      },
      type: 'colorpicker',
      default: '#409EFF',
    },
    aggregatePropField,
  ],
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
    },
  ],
}

export default gaugeDefinition

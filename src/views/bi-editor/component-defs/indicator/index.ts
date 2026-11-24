import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const indicatorDefinition: ComponentDefinition = {
  type: 'indicator',
  meta: {
    get name() {
      return t('editorMaterial.meta.indicator')
    },
    category: 'info',
    icon: 'Flag',
    defaultWidth: 200,
    defaultHeight: 100,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.title')
      },
      type: 'input',
      default: t('editorMaterial.ui.indicatorLabel'),
    },
    {
      key: 'value',
      get label() {
        return t('editorMaterial.ui.value')
      },
      type: 'number',
      default: 0,
    },
    {
      key: 'unit',
      get label() {
        return t('editorMaterial.ui.unit')
      },
      type: 'input',
      default: '',
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.valueFontSize')
      },
      type: 'slider',
      min: 16,
      max: 64,
      default: 32,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.valueColor')
      },
      type: 'colorpicker',
      default: '#333333',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
  ],
  defaultStyle: {},
}

export default indicatorDefinition

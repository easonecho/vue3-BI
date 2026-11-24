import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const progressDefinition: ComponentDefinition = {
  type: 'progress',
  meta: {
    get name() {
      return t('editorMaterial.meta.progressBar')
    },
    category: 'info',
    icon: 'Loading',
    defaultWidth: 300,
    defaultHeight: 20,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'value',
      get label() {
        return t('editorMaterial.ui.progress')
      },
      type: 'slider',
      min: 0,
      max: 100,
      default: 0,
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
      key: 'color',
      get label() {
        return t('editorMaterial.ui.color')
      },
      type: 'colorpicker',
      default: '#409EFF',
    },
    {
      key: 'showText',
      get label() {
        return t('editorMaterial.ui.showText')
      },
      type: 'switch',
      default: true,
    },
  ],
  defaultStyle: {},
}

export default progressDefinition

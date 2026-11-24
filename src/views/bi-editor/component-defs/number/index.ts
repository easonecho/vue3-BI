import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const numberDefinition: ComponentDefinition = {
  type: 'number',
  meta: {
    get name() {
      return t('editorMaterial.meta.number')
    },
    category: 'info',
    icon: 'Odometer',
    defaultWidth: 100,
    defaultHeight: 60,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'value',
      get label() {
        return t('editorMaterial.ui.value')
      },
      type: 'number',
      default: 0,
    },
    {
      key: 'prefix',
      get label() {
        return t('editorMaterial.ui.prefix')
      },
      type: 'input',
      default: '',
    },
    {
      key: 'suffix',
      get label() {
        return t('editorMaterial.ui.suffix')
      },
      type: 'input',
      default: '',
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'slider',
      min: 14,
      max: 72,
      default: 24,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.color')
      },
      type: 'colorpicker',
      default: '#333333',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'fontWeight',
      get label() {
        return t('editorMaterial.ui.fontWeight')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.normal')
          },
          value: 'normal',
        },
        {
          get label() {
            return t('editorMaterial.ui.bold')
          },
          value: 'bold',
        },
      ],
      default: 'bold',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
  ],
  defaultStyle: {},
}

export default numberDefinition

import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const rectDefinition: ComponentDefinition = {
  type: 'rect',
  meta: {
    get name() {
      return t('editorMaterial.ui.rectangle')
    },
    category: 'basic',
    icon: 'FullScreen',
    defaultWidth: 100,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'borderRadius',
      get label() {
        return t('editorMaterial.ui.cornerRadius')
      },
      type: 'slider',
      min: 0,
      max: 50,
      default: 0,
    },
    {
      key: 'borderWidth',
      get label() {
        return t('editorMaterial.ui.borderWidth')
      },
      type: 'slider',
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: 'borderColor',
      get label() {
        return t('editorMaterial.ui.borderColor')
      },
      type: 'colorpicker',
      default: '#333333',
    },
  ],
  defaultStyle: { backgroundColor: '#E5E7EB' },
}

export default rectDefinition

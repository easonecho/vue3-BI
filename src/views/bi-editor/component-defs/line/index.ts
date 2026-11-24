import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const lineDefinition: ComponentDefinition = {
  type: 'line',
  meta: {
    get name() {
      return t('editorMaterial.meta.line')
    },
    category: 'basic',
    icon: 'Minus',
    defaultWidth: 200,
    defaultHeight: 2,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'direction',
      get label() {
        return t('editorMaterial.ui.direction')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.horizontal')
          },
          value: 'horizontal',
        },
        {
          get label() {
            return t('editorMaterial.ui.vertical')
          },
          value: 'vertical',
        },
      ],
      default: 'horizontal',
    },
    {
      key: 'thickness',
      get label() {
        return t('editorMaterial.ui.thickness')
      },
      type: 'slider',
      min: 1,
      max: 20,
      default: 2,
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.color')
      },
      type: 'colorpicker',
      default: '#999999',
    },
  ],
  defaultStyle: {},
}

export default lineDefinition

import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const marqueeDefinition: ComponentDefinition = {
  type: 'marquee',
  meta: {
    get name() {
      return t('editorMaterial.meta.marquee')
    },
    category: 'info',
    icon: 'Notification',
    defaultWidth: 400,
    defaultHeight: 40,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'content',
      get label() {
        return t('editorMaterial.ui.content')
      },
      type: 'textarea',
      default: t('editorMaterial.ui.marqueeDefault'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'speed',
      get label() {
        return t('editorMaterial.ui.speedPxS')
      },
      type: 'slider',
      min: 10,
      max: 200,
      default: 60,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'direction',
      get label() {
        return t('editorMaterial.ui.direction')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.left')
          },
          value: 'left',
        },
        {
          get label() {
            return t('editorMaterial.ui.right')
          },
          value: 'right',
        },
      ],
      default: 'left',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'pauseOnHover',
      get label() {
        return t('editorMaterial.ui.pauseOnHover2')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'number',
      min: 12,
      max: 48,
      default: 16,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.textColor')
      },
      type: 'colorpicker',
      default: '#1f2937',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'bgColor',
      get label() {
        return t('editorMaterial.ui.backgroundColor')
      },
      type: 'colorpicker',
      default: 'transparent',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default marqueeDefinition

import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const qrcodeDefinition: ComponentDefinition = {
  type: 'qrcode',
  meta: {
    get name() {
      return t('editorMaterial.meta.qrCode')
    },
    category: 'basic',
    icon: 'Connection',
    defaultWidth: 160,
    defaultHeight: 160,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'content',
      get label() {
        return t('editorMaterial.ui.content')
      },
      type: 'textarea',
      default: 'https://trae.com',
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'size',
      get label() {
        return t('editorMaterial.ui.size')
      },
      type: 'number',
      min: 80,
      max: 400,
      default: 160,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'fgColor',
      get label() {
        return t('editorMaterial.ui.foregroundColor')
      },
      type: 'colorpicker',
      default: '#000000',
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
      default: '#ffffff',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'margin',
      get label() {
        return t('editorMaterial.ui.margin')
      },
      type: 'number',
      min: 0,
      max: 20,
      default: 2,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default qrcodeDefinition

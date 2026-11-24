import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const iconDefinition: ComponentDefinition = {
  type: 'icon',
  meta: {
    get name() {
      return t('editorMaterial.meta.icon')
    },
    category: 'basic',
    icon: 'Star',
    defaultWidth: 80,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'iconName',
      get label() {
        return t('editorMaterial.ui.iconName')
      },
      type: 'input',
      default: 'Star',
      get group() {
        return t('editorMaterial.ui.content')
      },
      get tip() {
        return t('editorMaterial.ui.elementPlusIconNameEGStarBellSetting')
      },
    },
    {
      key: 'size',
      get label() {
        return t('editorMaterial.ui.size2')
      },
      type: 'number',
      min: 12,
      max: 200,
      default: 32,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.color')
      },
      type: 'colorpicker',
      default: '#606266',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'rotate',
      get label() {
        return t('editorMaterial.ui.rotationAngle')
      },
      type: 'number',
      min: 0,
      max: 360,
      default: 0,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default iconDefinition

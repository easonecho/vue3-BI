import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const dividerDefinition: ComponentDefinition = {
  type: 'divider',
  meta: {
    get name() {
      return t('editorMaterial.meta.divider')
    },
    category: 'basic',
    icon: 'Minus',
    defaultWidth: 300,
    defaultHeight: 24,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'text',
      get label() {
        return t('editorMaterial.ui.centerText')
      },
      type: 'input',
      default: '',
      get group() {
        return t('editorMaterial.ui.content')
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
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'borderStyle',
      get label() {
        return t('editorMaterial.ui.lineStyle')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.solidLine')
          },
          value: 'solid',
        },
        {
          get label() {
            return t('editorMaterial.ui.dashedLine')
          },
          value: 'dashed',
        },
        {
          get label() {
            return t('editorMaterial.ui.dottedLine')
          },
          value: 'dotted',
        },
        {
          get label() {
            return t('editorMaterial.ui.doubleLine')
          },
          value: 'double',
        },
      ],
      default: 'solid',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'contentPosition',
      get label() {
        return t('editorMaterial.ui.textPosition')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.left2')
          },
          value: 'left',
        },
        {
          get label() {
            return t('editorMaterial.ui.center')
          },
          value: 'center',
        },
        {
          get label() {
            return t('editorMaterial.ui.right2')
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
      key: 'color',
      get label() {
        return t('editorMaterial.ui.color')
      },
      type: 'colorpicker',
      default: '#dcdfe6',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'thickness',
      get label() {
        return t('editorMaterial.ui.thickness')
      },
      type: 'number',
      min: 1,
      max: 10,
      default: 1,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default dividerDefinition

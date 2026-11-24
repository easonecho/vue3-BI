import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const flipNumberDefinition: ComponentDefinition = {
  type: 'flip-number',
  meta: {
    get name() {
      return t('editorMaterial.meta.flipNumber')
    },
    category: 'info',
    icon: 'Odometer',
    defaultWidth: 160,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'value',
      get label() {
        return t('editorMaterial.ui.targetValue')
      },
      type: 'number',
      default: 0,
      get group() {
        return t('editorMaterial.ui.data')
      },
      get tip() {
        return t('editorMaterial.ui.targetValue')
      },
    },
    {
      key: 'decimals',
      get label() {
        return t('editorMaterial.ui.decimalPlaces')
      },
      type: 'slider',
      min: 0,
      max: 3,
      default: 0,
      get group() {
        return t('editorMaterial.ui.data')
      },
      get tip() {
        return t('editorMaterial.ui.decimalPlaces')
      },
    },
    {
      key: 'prefix',
      get label() {
        return t('editorMaterial.ui.prefix')
      },
      type: 'input',
      default: '',
      get group() {
        return t('editorMaterial.ui.data')
      },
      get tip() {
        return t('editorMaterial.ui.prefixEG')
      },
    },
    {
      key: 'suffix',
      get label() {
        return t('editorMaterial.ui.suffix')
      },
      type: 'input',
      default: '',
      get group() {
        return t('editorMaterial.ui.data')
      },
      get tip() {
        return t('editorMaterial.ui.suffixEG')
      },
    },
    {
      key: 'duration',
      get label() {
        return t('editorMaterial.ui.animationDuration')
      },
      type: 'slider',
      min: 500,
      max: 5000,
      step: 100,
      default: 1500,
      get group() {
        return t('editorMaterial.ui.animation')
      },
      get tip() {
        return t('editorMaterial.ui.flipAnimationDurationMs')
      },
    },
    {
      key: 'separator',
      get label() {
        return t('editorMaterial.ui.thousandsSeparator')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.format')
      },
      get tip() {
        return t('editorMaterial.ui.thousandsSeparator')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'slider',
      min: 20,
      max: 96,
      default: 40,
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
      default: '#22d3ee',
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
    {
      key: 'flipColor',
      get label() {
        return t('editorMaterial.ui.flipShadowColor2')
      },
      type: 'colorpicker',
      default: '#0e7490',
      get group() {
        return t('editorMaterial.ui.animation')
      },
      get tip() {
        return t('editorMaterial.ui.flipShadowColor')
      },
    },
  ],
  defaultStyle: {},
}

export default flipNumberDefinition

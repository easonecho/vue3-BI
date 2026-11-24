import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const datePickerDefinition: ComponentDefinition = {
  type: 'date-picker',
  meta: {
    get name() {
      return t('editorMaterial.meta.datePicker')
    },
    category: 'data',
    icon: 'Calendar',
    defaultWidth: 220,
    defaultHeight: 40,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'mode',
      get label() {
        return t('editorMaterial.ui.type')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.date')
          },
          value: 'date',
        },
        {
          get label() {
            return t('editorMaterial.ui.time')
          },
          value: 'time',
        },
        {
          get label() {
            return t('editorMaterial.ui.dateTime')
          },
          value: 'datetime',
        },
      ],
      default: 'date',
      get group() {
        return t('editorMaterial.ui.type')
      },
    },
    {
      key: 'placeholder',
      get label() {
        return t('editorMaterial.ui.placeholderText')
      },
      type: 'input',
      default: t('editorMaterial.ui.selectDate'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'defaultValue',
      get label() {
        return t('editorMaterial.ui.defaultValue')
      },
      type: 'input',
      default: '',
      get group() {
        return t('editorMaterial.ui.content')
      },
      get tip() {
        return t('editorMaterial.ui.defaultValueFormatYyyyMmDdOrHhMmOrYyyyMmDdthhMm')
      },
    },
    {
      key: 'showLabel',
      get label() {
        return t('editorMaterial.ui.showLeftLabels')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.appearance')
      },
      get tip() {
        return t('editorMaterial.ui.showLeftLabels')
      },
    },
    {
      key: 'labelText',
      get label() {
        return t('editorMaterial.ui.labelText')
      },
      type: 'input',
      default: t('editorMaterial.ui.date'),
      get group() {
        return t('editorMaterial.ui.appearance')
      },
    },
    {
      key: 'bgColor',
      get label() {
        return t('editorMaterial.ui.backgroundColor2')
      },
      type: 'colorpicker',
      default: '#1e293b',
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'textColor',
      get label() {
        return t('editorMaterial.ui.textColor')
      },
      type: 'colorpicker',
      default: '#e2e8f0',
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'borderColor',
      get label() {
        return t('editorMaterial.ui.borderColor')
      },
      type: 'colorpicker',
      default: '#475569',
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'accentColor',
      get label() {
        return t('editorMaterial.ui.accentColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.focusColor')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'slider',
      min: 10,
      max: 18,
      default: 13,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'borderRadius',
      get label() {
        return t('editorMaterial.ui.cornerRadius')
      },
      type: 'slider',
      min: 0,
      max: 20,
      default: 4,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  defaultStyle: {},
}

export default datePickerDefinition

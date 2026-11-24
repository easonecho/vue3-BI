import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const descriptionListDefinition: ComponentDefinition = {
  type: 'description-list',
  meta: {
    get name() {
      return t('editorMaterial.meta.descriptionList')
    },
    category: 'data',
    icon: 'Document',
    defaultWidth: 400,
    defaultHeight: 200,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.title')
      },
      type: 'input',
      default: t('editorMaterial.ui.deviceDetail'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    // ============ 样式 ============
    {
      key: 'columns',
      get label() {
        return t('editorMaterial.ui.columnsPerRow')
      },
      type: 'number',
      min: 1,
      max: 4,
      default: 2,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'bordered',
      get label() {
        return t('editorMaterial.ui.showBorder')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'striped',
      get label() {
        return t('editorMaterial.ui.zebraStripes')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'labelWidth',
      get label() {
        return t('editorMaterial.ui.labelColumnWidth')
      },
      type: 'number',
      min: 80,
      max: 240,
      default: 120,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'labelColor',
      get label() {
        return t('editorMaterial.ui.labelColor2')
      },
      type: 'colorpicker',
      default: '#6b7280',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'valueColor',
      get label() {
        return t('editorMaterial.ui.valueColor2')
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
      default: '#fff',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'borderColor',
      get label() {
        return t('editorMaterial.ui.borderColor')
      },
      type: 'colorpicker',
      default: '#e5e7eb',
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
      max: 20,
      default: 14,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'titleColor',
      get label() {
        return t('editorMaterial.ui.titleColor')
      },
      type: 'colorpicker',
      default: '#1f2937',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'titleFontSize',
      get label() {
        return t('editorMaterial.ui.titleFontSize')
      },
      type: 'number',
      min: 12,
      max: 24,
      default: 16,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  extraDefaults: {
    items: [
      {
        get label() {
          return t('editorMaterial.ui.deviceName')
        },
        value: '服务器-01',
      },
      {
        get label() {
          return t('editorMaterial.ui.ipAddress')
        },
        value: '192.168.1.100',
      },
      {
        get label() {
          return t('editorMaterial.ui.status')
        },
        value: '运行中',
      },
      { label: 'CPU', value: '45%' },
      {
        get label() {
          return t('editorMaterial.ui.memory')
        },
        value: '8.2 GB',
      },
      {
        get label() {
          return t('editorMaterial.ui.position')
        },
        value: '机房A-机柜3',
      },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'labelField',
      get label() {
        return t('editorMaterial.ui.labelField')
      },
      type: 'category',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField2')
      },
      type: 'value',
    },
  ],
}

export default descriptionListDefinition

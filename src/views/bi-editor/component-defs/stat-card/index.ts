import type { ComponentDefinition } from '../types'
import { aggregatePropField } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const statCardDefinition: ComponentDefinition = {
  type: 'stat-card',
  meta: {
    get name() {
      return t('editorMaterial.meta.statCard')
    },
    category: 'info',
    icon: 'Histogram',
    defaultWidth: 240,
    defaultHeight: 120,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.title')
      },
      type: 'input',
      default: t('editorMaterial.ui.totalSales'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'value',
      get label() {
        return t('editorMaterial.ui.value')
      },
      type: 'input',
      default: '¥126,560',
      get group() {
        return t('editorMaterial.ui.content')
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
        return t('editorMaterial.ui.content')
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
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'trend',
      get label() {
        return t('editorMaterial.ui.trend')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.up')
          },
          value: 'up',
        },
        {
          get label() {
            return t('editorMaterial.ui.down')
          },
          value: 'down',
        },
        {
          get label() {
            return t('editorMaterial.ui.unchanged')
          },
          value: 'flat',
        },
      ],
      default: 'up',
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'trendValue',
      get label() {
        return t('editorMaterial.ui.trendValue')
      },
      type: 'input',
      default: '+12.5%',
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'iconName',
      get label() {
        return t('editorMaterial.ui.iconName')
      },
      type: 'input',
      default: 'TrendCharts',
      get group() {
        return t('editorMaterial.ui.content')
      },
      get tip() {
        return t('editorMaterial.ui.elementPlusIconName')
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
      key: 'textColor',
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
      key: 'titleColor',
      get label() {
        return t('editorMaterial.ui.titleColor')
      },
      type: 'colorpicker',
      default: '#6b7280',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'accentColor',
      get label() {
        return t('editorMaterial.ui.accentColor')
      },
      type: 'colorpicker',
      default: '#5470c6',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.valueFontSize')
      },
      type: 'number',
      min: 12,
      max: 48,
      default: 24,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'borderRadius',
      get label() {
        return t('editorMaterial.ui.cornerRadius')
      },
      type: 'number',
      min: 0,
      max: 24,
      default: 8,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'showIcon',
      get label() {
        return t('editorMaterial.ui.showIcon')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    aggregatePropField,
  ],
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
    },
  ],
}

export default statCardDefinition

import type { ComponentDefinition } from '../types'
import { aggregatePropField } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const kpiCardDefinition: ComponentDefinition = {
  type: 'kpi-card',
  meta: {
    get name() {
      return t('editorMaterial.meta.kpiCard')
    },
    category: 'info',
    icon: 'Histogram',
    defaultWidth: 280,
    defaultHeight: 140,
  },
  widget: Widget,
  propsSchema: [
    // ============ 内容 ============
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.title')
      },
      type: 'input',
      default: t('editorMaterial.ui.monthlyRevenue'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'value',
      get label() {
        return t('editorMaterial.ui.mainMetricValue')
      },
      type: 'input',
      default: '¥1,256,800',
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'target',
      get label() {
        return t('editorMaterial.ui.targetValue2')
      },
      type: 'input',
      default: '¥1,500,000',
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'unit',
      get label() {
        return t('editorMaterial.ui.unit')
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
        return t('editorMaterial.ui.trendDirection')
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
      key: 'trendLabel',
      get label() {
        return t('editorMaterial.ui.trendLabel')
      },
      type: 'input',
      default: t('editorMaterial.ui.yoy'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'sparkData',
      get label() {
        return t('editorMaterial.ui.miniLineData')
      },
      type: 'json',
      default: [120, 200, 150, 80, 70, 110, 130, 180],
      get group() {
        return t('editorMaterial.ui.content')
      },
      get tip() {
        return t('editorMaterial.ui.miniSparkLineDataArrayOfNumbers')
      },
    },
    aggregatePropField,
    // ============ 样式 ============
    {
      key: 'showProgress',
      get label() {
        return t('editorMaterial.ui.showAchievementProgressBar')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'showSpark',
      get label() {
        return t('editorMaterial.ui.showMiniLine')
      },
      type: 'switch',
      default: true,
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
      key: 'textColor',
      get label() {
        return t('editorMaterial.ui.primaryTextColor2')
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
      key: 'trendUpColor',
      get label() {
        return t('editorMaterial.ui.upColor')
      },
      type: 'colorpicker',
      default: '#2ec07e',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'trendDownColor',
      get label() {
        return t('editorMaterial.ui.downColor')
      },
      type: 'colorpicker',
      default: '#ee6666',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'progressColor',
      get label() {
        return t('editorMaterial.ui.progressBarColor')
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
      default: 28,
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
    {
      key: 'sparkField',
      get label() {
        return t('editorMaterial.ui.miniLineField')
      },
      type: 'value',
    },
  ],
}

export default kpiCardDefinition

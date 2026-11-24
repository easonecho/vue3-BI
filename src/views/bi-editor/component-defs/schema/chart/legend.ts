import type { PropField } from '../props'
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from '../options'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 图表图例配置 Schema（chartCommonSchema 的「图例」分组） */
export const chartLegendSchema: PropField[] = [
  // ============ 图例 ============
  {
    key: 'legendShow',
    get label() {
      return t('editorMaterial.ui.showLegend')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.legend')
    },
  },
  {
    key: 'legendPosition',
    get label() {
      return t('editorMaterial.ui.legendPosition')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.top')
        },
        value: 'top',
      },
      {
        get label() {
          return t('editorMaterial.ui.bottom')
        },
        value: 'bottom',
      },
      {
        get label() {
          return t('editorMaterial.ui.left3')
        },
        value: 'left',
      },
      {
        get label() {
          return t('editorMaterial.ui.right3')
        },
        value: 'right',
      },
    ],
    default: 'bottom',
    get group() {
      return t('editorMaterial.ui.legend')
    },
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendItemGap',
    get label() {
      return t('editorMaterial.ui.legendGap')
    },
    type: 'slider',
    min: 0,
    max: 60,
    default: 16,
    get group() {
      return t('editorMaterial.ui.legend')
    },
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontFamily',
    get label() {
      return t('editorMaterial.ui.font')
    },
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    get group() {
      return t('editorMaterial.ui.legend')
    },
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontSize',
    get label() {
      return t('editorMaterial.ui.fontSize')
    },
    type: 'slider',
    min: 10,
    max: 24,
    default: 12,
    get group() {
      return t('editorMaterial.ui.legend')
    },
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontWeight',
    get label() {
      return t('editorMaterial.ui.fontWeight')
    },
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.legend')
    },
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontStyle',
    get label() {
      return t('editorMaterial.ui.styleItalic')
    },
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.legend')
    },
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendColor',
    get label() {
      return t('editorMaterial.ui.textColor')
    },
    type: 'colorpicker',
    default: '#6b7280',
    get group() {
      return t('editorMaterial.ui.legend')
    },
    visibleWhen: { field: 'legendShow', truthy: true },
  },
]

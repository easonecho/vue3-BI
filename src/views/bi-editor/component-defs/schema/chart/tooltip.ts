import type { PropField } from '../props'
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from '../options'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 图表提示框配置 Schema（chartCommonSchema 的「提示框」分组） */
export const chartTooltipSchema: PropField[] = [
  // ============ 提示框 Tooltip ============
  {
    key: 'tooltipShow',
    get label() {
      return t('editorMaterial.ui.enableTooltip')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
  },
  {
    key: 'tooltipTrigger',
    get label() {
      return t('editorMaterial.ui.triggerType')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.itemTrigger')
        },
        value: 'item',
      },
      {
        get label() {
          return t('editorMaterial.ui.axisTrigger')
        },
        value: 'axis',
      },
      {
        get label() {
          return t('editorMaterial.ui.none')
        },
        value: 'none',
      },
    ],
    default: 'item',
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipBgColor',
    get label() {
      return t('editorMaterial.ui.backgroundColor2')
    },
    type: 'colorpicker',
    default: '#ffffff',
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipBorderColor',
    get label() {
      return t('editorMaterial.ui.borderColor')
    },
    type: 'colorpicker',
    default: '#e5e7eb',
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontFamily',
    get label() {
      return t('editorMaterial.ui.font')
    },
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontSize',
    get label() {
      return t('editorMaterial.ui.fontSize')
    },
    type: 'slider',
    min: 10,
    max: 20,
    default: 12,
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontWeight',
    get label() {
      return t('editorMaterial.ui.fontWeight')
    },
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontStyle',
    get label() {
      return t('editorMaterial.ui.styleItalic')
    },
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextColor',
    get label() {
      return t('editorMaterial.ui.textColor')
    },
    type: 'colorpicker',
    default: '#374151',
    get group() {
      return t('editorMaterial.ui.tooltip')
    },
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
]

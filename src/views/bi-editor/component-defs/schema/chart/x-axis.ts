import type { PropField } from '../props'
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from '../options'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 X 轴配置 Schema（chartAxesSchema 的「X 轴」分组） */
export const chartXAxisSchema: PropField[] = [
  // ============ X 轴 ============
  {
    key: 'xAxisShow',
    get label() {
      return t('editorMaterial.ui.showXAxis')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
  },
  {
    key: 'xAxisType',
    get label() {
      return t('editorMaterial.ui.xAxisType')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.categoryAxisDiscrete')
        },
        value: 'category',
      },
      {
        get label() {
          return t('editorMaterial.ui.valueAxisContinuous')
        },
        value: 'value',
      },
      {
        get label() {
          return t('editorMaterial.ui.timeAxis')
        },
        value: 'time',
      },
      {
        get label() {
          return t('editorMaterial.ui.logAxis')
        },
        value: 'log',
      },
    ],
    default: 'category',
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelShow',
    get label() {
      return t('editorMaterial.ui.showTickLabels')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelFontFamily',
    get label() {
      return t('editorMaterial.ui.tickFont')
    },
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelFontSize',
    get label() {
      return t('editorMaterial.ui.tickFontSize')
    },
    type: 'slider',
    min: 10,
    max: 24,
    default: 12,
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelFontWeight',
    get label() {
      return t('editorMaterial.ui.tickFontWeight')
    },
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelFontStyle',
    get label() {
      return t('editorMaterial.ui.tickStyleItalic')
    },
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelColor',
    get label() {
      return t('editorMaterial.ui.tickColor')
    },
    type: 'colorpicker',
    default: '#6b7280',
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisAxisLineShow',
    get label() {
      return t('editorMaterial.ui.showAxisLine')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisAxisLineColor',
    get label() {
      return t('editorMaterial.ui.axisLineColor')
    },
    type: 'colorpicker',
    default: '#e5e7eb',
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisSplitLineShow',
    get label() {
      return t('editorMaterial.ui.showGridLines')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisSplitLineColor',
    get label() {
      return t('editorMaterial.ui.gridLineColor')
    },
    type: 'colorpicker',
    default: '#f3f4f6',
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisInverse',
    get label() {
      return t('editorMaterial.ui.inverseAxis')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.xAxis')
    },
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
]

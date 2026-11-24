import type { PropField } from '../props'
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from '../options'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 Y 轴配置 Schema（chartAxesSchema 的「Y 轴」分组） */
export const chartYAxisSchema: PropField[] = [
  // ============ Y 轴 ============
  {
    key: 'yAxisShow',
    get label() {
      return t('editorMaterial.ui.showYAxis')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
  },
  {
    key: 'yAxisType',
    get label() {
      return t('editorMaterial.ui.yAxisType')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.valueAxisContinuous')
        },
        value: 'value',
      },
      {
        get label() {
          return t('editorMaterial.ui.categoryAxisDiscrete')
        },
        value: 'category',
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
    default: 'value',
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelShow',
    get label() {
      return t('editorMaterial.ui.showTickLabels')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelFontFamily',
    get label() {
      return t('editorMaterial.ui.tickFont')
    },
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelFontSize',
    get label() {
      return t('editorMaterial.ui.tickFontSize')
    },
    type: 'slider',
    min: 10,
    max: 24,
    default: 12,
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelFontWeight',
    get label() {
      return t('editorMaterial.ui.tickFontWeight')
    },
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelFontStyle',
    get label() {
      return t('editorMaterial.ui.tickStyleItalic')
    },
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelColor',
    get label() {
      return t('editorMaterial.ui.tickColor')
    },
    type: 'colorpicker',
    default: '#6b7280',
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisAxisLineShow',
    get label() {
      return t('editorMaterial.ui.showAxisLine')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisAxisLineColor',
    get label() {
      return t('editorMaterial.ui.axisLineColor')
    },
    type: 'colorpicker',
    default: '#e5e7eb',
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisSplitLineShow',
    get label() {
      return t('editorMaterial.ui.showGridLines')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisSplitLineColor',
    get label() {
      return t('editorMaterial.ui.gridLineColor')
    },
    type: 'colorpicker',
    default: '#f3f4f6',
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisInverse',
    get label() {
      return t('editorMaterial.ui.inverseAxis')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.yAxis')
    },
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
]

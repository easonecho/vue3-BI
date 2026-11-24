import type { PropField } from '../props'
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from '../options'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 图表标题配置 Schema（chartCommonSchema 的「标题」分组） */
export const chartTitleSchema: PropField[] = [
  // ============ 标题 ============
  {
    key: 'titleShow',
    get label() {
      return t('editorMaterial.ui.showTitle')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.title')
    },
  },
  {
    key: 'titleText',
    get label() {
      return t('editorMaterial.ui.titleText')
    },
    type: 'input',
    default: '',
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleLeft',
    get label() {
      return t('editorMaterial.ui.horizontalPosition')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.leftAlign')
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
          return t('editorMaterial.ui.rightAlign')
        },
        value: 'right',
      },
    ],
    default: 'center',
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleTop',
    get label() {
      return t('editorMaterial.ui.verticalPosition')
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
          return t('editorMaterial.ui.center')
        },
        value: 'middle',
      },
      {
        get label() {
          return t('editorMaterial.ui.bottom')
        },
        value: 'bottom',
      },
    ],
    default: 'top',
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontSize',
    get label() {
      return t('editorMaterial.ui.fontSize')
    },
    type: 'slider',
    min: 10,
    max: 48,
    default: 14,
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontFamily',
    get label() {
      return t('editorMaterial.ui.font')
    },
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontWeight',
    get label() {
      return t('editorMaterial.ui.fontWeight')
    },
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'bold',
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontStyle',
    get label() {
      return t('editorMaterial.ui.styleItalic')
    },
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleColor',
    get label() {
      return t('editorMaterial.ui.textColor')
    },
    type: 'colorpicker',
    default: '#1f2937',
    get group() {
      return t('editorMaterial.ui.title')
    },
    visibleWhen: { field: 'titleShow', truthy: true },
  },
]

import type { PropField } from '../props'
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from '../options'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/**
 * 🔑 系列标签通用配置（每个图表的系列 label 文本样式）
 *   使用方式：每个图表的 propsSchema 末尾 [...buildSeriesLabelSchema(defaultPosition)] 合并
 */
export function buildSeriesLabelSchema(defaultPosition: string = 'top'): PropField[] {
  return [
    {
      key: 'seriesLabelFontFamily',
      get label() {
        return t('editorMaterial.ui.font')
      },
      type: 'select',
      options: [...FONT_FAMILY_OPTIONS],
      default: DEFAULT_FONT_FAMILY,
      get group() {
        return t('editorMaterial.ui.seriesLabel')
      },
    },
    {
      key: 'seriesLabelFontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'slider',
      min: 10,
      max: 36,
      default: 12,
      get group() {
        return t('editorMaterial.ui.seriesLabel')
      },
    },
    {
      key: 'seriesLabelFontWeight',
      get label() {
        return t('editorMaterial.ui.fontWeight')
      },
      type: 'select',
      options: [...FONT_WEIGHT_OPTIONS],
      default: 'normal',
      get group() {
        return t('editorMaterial.ui.seriesLabel')
      },
    },
    {
      key: 'seriesLabelFontStyle',
      get label() {
        return t('editorMaterial.ui.styleItalic')
      },
      type: 'select',
      options: [...FONT_STYLE_OPTIONS],
      default: 'normal',
      get group() {
        return t('editorMaterial.ui.seriesLabel')
      },
    },
    {
      key: 'seriesLabelColor',
      get label() {
        return t('editorMaterial.ui.textColor')
      },
      type: 'colorpicker',
      default: '#6b7280',
      get group() {
        return t('editorMaterial.ui.seriesLabel')
      },
    },
    {
      key: 'seriesLabelPosition',
      get label() {
        return t('editorMaterial.ui.labelPosition')
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
            return t('editorMaterial.ui.innerTop')
          },
          value: 'insideTop',
        },
        {
          get label() {
            return t('editorMaterial.ui.center')
          },
          value: 'inside',
        },
        {
          get label() {
            return t('editorMaterial.ui.innerBottom')
          },
          value: 'insideBottom',
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
      default: defaultPosition,
      get group() {
        return t('editorMaterial.ui.seriesLabel')
      },
    },
  ]
}

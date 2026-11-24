import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const decorBorderDefinition: ComponentDefinition = {
  type: 'decor-border',
  meta: {
    get name() {
      return t('editorMaterial.meta.decorBorder')
    },
    category: 'basic',
    icon: 'Box',
    defaultWidth: 300,
    defaultHeight: 200,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'bgImage',
      get label() {
        return t('editorMaterial.ui.backgroundImageAsset')
      },
      type: 'asset',
      assetType: 'image',
      default: '',
      get group() {
        return t('editorMaterial.ui.source')
      },
      get tip() {
        return t(
          'editorMaterial.ui.optionalSelectABackgroundImageFromTheAssetLibraryAboveStyleBackground',
        )
      },
    },
    {
      key: 'style',
      get label() {
        return t('editorMaterial.ui.style')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.techCorner')
          },
          value: 'corner',
        },
        {
          get label() {
            return t('editorMaterial.ui.flowingBorder')
          },
          value: 'flow',
        },
        {
          get label() {
            return t('editorMaterial.ui.grid')
          },
          value: 'grid',
        },
        {
          get label() {
            return t('editorMaterial.ui.simple')
          },
          value: 'simple',
        },
      ],
      default: 'corner',
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
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'cornerColor',
      get label() {
        return t('editorMaterial.ui.badgeColor')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.badgeColor')
      },
    },
    {
      key: 'bgColor',
      get label() {
        return t('editorMaterial.ui.backgroundColor2')
      },
      type: 'colorpicker',
      default: 'rgba(15,23,42,0.4)',
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'borderWidth',
      get label() {
        return t('editorMaterial.ui.borderWidth')
      },
      type: 'slider',
      min: 1,
      max: 6,
      default: 2,
      get group() {
        return t('editorMaterial.ui.line')
      },
    },
    {
      key: 'cornerSize',
      get label() {
        return t('editorMaterial.ui.badgeSize')
      },
      type: 'slider',
      min: 8,
      max: 30,
      default: 16,
      get group() {
        return t('editorMaterial.ui.badge')
      },
    },
    {
      key: 'showCorner',
      get label() {
        return t('editorMaterial.ui.showBadge')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.badge')
      },
      get tip() {
        return t('editorMaterial.ui.showCornerDecorations')
      },
    },
  ],
  defaultStyle: {},
}

export default decorBorderDefinition

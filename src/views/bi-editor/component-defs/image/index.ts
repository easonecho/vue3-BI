import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const imageDefinition: ComponentDefinition = {
  type: 'image',
  meta: {
    get name() {
      return t('editorMaterial.meta.image')
    },
    category: 'basic',
    icon: 'Picture',
    defaultWidth: 160,
    defaultHeight: 120,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'src',
      get label() {
        return t('editorMaterial.ui.imageAsset')
      },
      type: 'asset',
      assetType: 'image',
      default: '',
      get tip() {
        return t('editorMaterial.ui.selectAnImageFromTheAssetLibrary')
      },
    },
    {
      key: 'alt',
      get label() {
        return t('editorMaterial.ui.altText')
      },
      type: 'input',
      default: '',
    },
    {
      key: 'objectFit',
      get label() {
        return t('editorMaterial.ui.fillMode')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.stretchFill')
          },
          value: 'fill',
        },
        {
          get label() {
            return t('editorMaterial.ui.containKeepAspectRatio')
          },
          value: 'contain',
        },
        {
          get label() {
            return t('editorMaterial.ui.coverCropWhileKeepingAspectRatio')
          },
          value: 'cover',
        },
        {
          get label() {
            return t('editorMaterial.ui.doNothing')
          },
          value: 'none',
        },
        {
          get label() {
            return t('editorMaterial.ui.scaleDownProportionally')
          },
          value: 'scale-down',
        },
      ],
      default: 'contain',
    },
    {
      key: 'borderRadius',
      get label() {
        return t('editorMaterial.ui.cornerRadius')
      },
      type: 'slider',
      min: 0,
      max: 50,
      default: 0,
    },
  ],
  defaultStyle: {},
}

export default imageDefinition

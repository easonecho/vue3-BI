import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const carouselDefinition: ComponentDefinition = {
  type: 'carousel',
  meta: {
    get name() {
      return t('editorMaterial.meta.carousel')
    },
    category: 'basic',
    icon: 'PictureFilled',
    defaultWidth: 480,
    defaultHeight: 270,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'images',
      get label() {
        return t('editorMaterial.ui.imageAsset')
      },
      type: 'asset',
      assetType: 'image',
      multiple: true,
      default: [
        'https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2901208/pexels-photo-2901208.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/902290/pexels-photo-902290.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      get group() {
        return t('editorMaterial.ui.source')
      },
      get tip() {
        return t('editorMaterial.ui.selectMultipleImagesFromTheAssetLibraryForTheCarousel')
      },
    },
    {
      key: 'interval',
      get label() {
        return t('editorMaterial.ui.switchIntervalMs')
      },
      type: 'slider',
      min: 1000,
      max: 10000,
      step: 500,
      default: 3000,
      get group() {
        return t('editorMaterial.ui.carousel')
      },
      get tip() {
        return t('editorMaterial.ui.switchIntervalMs')
      },
    },
    {
      key: 'autoplay',
      get label() {
        return t('editorMaterial.ui.autoplay')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.carousel')
      },
      get tip() {
        return t('editorMaterial.ui.autoplay')
      },
    },
    {
      key: 'showArrow',
      get label() {
        return t('editorMaterial.ui.showLeftRightArrows')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.navigation')
      },
      get tip() {
        return t('editorMaterial.ui.showLeftRightArrows')
      },
    },
    {
      key: 'showIndicator',
      get label() {
        return t('editorMaterial.ui.bottomIndicators')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.navigation')
      },
      get tip() {
        return t('editorMaterial.ui.bottomIndicators')
      },
    },
    {
      key: 'effect',
      get label() {
        return t('editorMaterial.ui.transitionEffect')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.fade')
          },
          value: 'fade',
        },
        {
          get label() {
            return t('editorMaterial.ui.slide')
          },
          value: 'slide',
        },
      ],
      default: 'slide',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'arrowColor',
      get label() {
        return t('editorMaterial.ui.arrowColor')
      },
      type: 'colorpicker',
      default: '#ffffff',
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'indicatorColor',
      get label() {
        return t('editorMaterial.ui.indicatorDotColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'borderRadius',
      get label() {
        return t('editorMaterial.ui.cornerRadius')
      },
      type: 'slider',
      min: 0,
      max: 20,
      default: 4,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  defaultStyle: {},
}

export default carouselDefinition

import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const videoPlayerDefinition: ComponentDefinition = {
  type: 'video-player',
  meta: {
    get name() {
      return t('editorMaterial.meta.videoPlayer')
    },
    category: 'basic',
    icon: 'VideoPlay',
    defaultWidth: 480,
    defaultHeight: 270,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'src',
      get label() {
        return t('editorMaterial.ui.videoAsset')
      },
      type: 'asset',
      assetType: 'video',
      default: 'https://www.w3schools.com/html/mov_bbb.mp4',
      get group() {
        return t('editorMaterial.ui.source')
      },
      get tip() {
        return t('editorMaterial.ui.selectAVideoFromTheAssetLibraryOrKeepTheDefaultDemoUrl')
      },
    },
    {
      key: 'poster',
      get label() {
        return t('editorMaterial.ui.coverImageAsset')
      },
      type: 'asset',
      assetType: 'image',
      default: '',
      get group() {
        return t('editorMaterial.ui.source')
      },
      get tip() {
        return t('editorMaterial.ui.optionalSelectACoverImageFromTheAssetLibrary')
      },
    },
    {
      key: 'autoplay',
      get label() {
        return t('editorMaterial.ui.autoplay')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.play')
      },
      get tip() {
        return t('editorMaterial.ui.autoplayMutedDueToBrowserPolicy')
      },
    },
    {
      key: 'loop',
      get label() {
        return t('editorMaterial.ui.loop')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.play')
      },
      get tip() {
        return t('editorMaterial.ui.loop')
      },
    },
    {
      key: 'muted',
      get label() {
        return t('editorMaterial.ui.mute')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.play')
      },
      get tip() {
        return t('editorMaterial.ui.muteRequiredWhenAutoplayTrue')
      },
    },
    {
      key: 'controls',
      get label() {
        return t('editorMaterial.ui.showControls')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.play')
      },
      get tip() {
        return t('editorMaterial.ui.showControls')
      },
    },
    {
      key: 'objectFit',
      get label() {
        return t('editorMaterial.ui.fillMode2')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.fill')
          },
          value: 'fill',
        },
        {
          get label() {
            return t('editorMaterial.ui.contains')
          },
          value: 'contain',
        },
        {
          get label() {
            return t('editorMaterial.ui.cover')
          },
          value: 'cover',
        },
        {
          get label() {
            return t('editorMaterial.ui.zoom')
          },
          value: 'scale-down',
        },
      ],
      default: 'contain',
      get group() {
        return t('editorMaterial.ui.style')
      },
      get placeholder() {
        return t('editorMaterial.ui.fillMode2')
      },
    },
  ],
  defaultStyle: {},
}

export default videoPlayerDefinition

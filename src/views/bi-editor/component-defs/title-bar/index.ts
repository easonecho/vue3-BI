import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const titleBarDefinition: ComponentDefinition = {
  type: 'title-bar',
  meta: {
    get name() {
      return t('editorMaterial.meta.titleBar')
    },
    category: 'basic',
    icon: 'Flag',
    defaultWidth: 500,
    defaultHeight: 60,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.mainTitle')
      },
      type: 'textarea',
      default: t('editorMaterial.ui.dashboardTitle'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'subtitle',
      get label() {
        return t('editorMaterial.ui.subtitle')
      },
      type: 'input',
      default: 'DATA VISUALIZATION',
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'showDecor',
      get label() {
        return t('editorMaterial.ui.showDecorativeLine')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.decoration')
      },
      get tip() {
        return t('editorMaterial.ui.showDecorativeSideLines')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.mainTitleFontSize')
      },
      type: 'slider',
      min: 14,
      max: 48,
      default: 24,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'subtitleFontSize',
      get label() {
        return t('editorMaterial.ui.subtitleFontSize')
      },
      type: 'slider',
      min: 10,
      max: 24,
      default: 12,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.mainTitleColor')
      },
      type: 'colorpicker',
      default: '#ffffff',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'subtitleColor',
      get label() {
        return t('editorMaterial.ui.subtitleColor')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'fontWeight',
      get label() {
        return t('editorMaterial.ui.fontWeight')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.normal')
          },
          value: 'normal',
        },
        {
          get label() {
            return t('editorMaterial.ui.bold')
          },
          value: 'bold',
        },
      ],
      default: 'bold',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'decorColor',
      get label() {
        return t('editorMaterial.ui.decorativeLineColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.decoration')
      },
    },
    {
      key: 'decorWidth',
      get label() {
        return t('editorMaterial.ui.decorativeLineLength2')
      },
      type: 'slider',
      min: 0,
      max: 200,
      default: 80,
      get group() {
        return t('editorMaterial.ui.decoration')
      },
      get tip() {
        return t('editorMaterial.ui.decorativeLineLength')
      },
    },
    {
      key: 'bgFrom',
      get label() {
        return t('editorMaterial.ui.backgroundStartColor')
      },
      type: 'colorpicker',
      default: '#0f172a',
      get group() {
        return t('editorMaterial.ui.background')
      },
      get tip() {
        return t('editorMaterial.ui.backgroundGradientStartColor')
      },
    },
    {
      key: 'bgTo',
      get label() {
        return t('editorMaterial.ui.backgroundEndColor')
      },
      type: 'colorpicker',
      default: '#1e293b',
      get group() {
        return t('editorMaterial.ui.background')
      },
      get tip() {
        return t('editorMaterial.ui.backgroundGradientEndColor')
      },
    },
  ],
  defaultStyle: {},
}

export default titleBarDefinition

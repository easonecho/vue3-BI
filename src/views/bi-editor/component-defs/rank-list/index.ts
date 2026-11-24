import type { ComponentDefinition } from '../types'
import { aggregatePropField } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const rankListDefinition: ComponentDefinition = {
  type: 'rank-list',
  meta: {
    get name() {
      return t('editorMaterial.meta.rankList')
    },
    category: 'data',
    icon: 'Rank',
    defaultWidth: 300,
    defaultHeight: 280,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.title')
      },
      type: 'input',
      default: t('editorMaterial.meta.rankList'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'showTitle',
      get label() {
        return t('editorMaterial.ui.showTitle')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'top',
      get label() {
        return t('editorMaterial.ui.showTopN2')
      },
      type: 'number',
      default: 5,
      min: 1,
      max: 20,
      get group() {
        return t('editorMaterial.ui.content')
      },
      get tip() {
        return t('editorMaterial.ui.showTopN')
      },
    },
    {
      key: 'barColor',
      get label() {
        return t('editorMaterial.ui.progressBarColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'barBgColor',
      get label() {
        return t('editorMaterial.ui.progressBarBackground')
      },
      type: 'colorpicker',
      default: '#1e293b',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'slider',
      min: 10,
      max: 20,
      default: 12,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'nameColor',
      get label() {
        return t('editorMaterial.ui.nameColor')
      },
      type: 'colorpicker',
      default: '#e2e8f0',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'valueColor',
      get label() {
        return t('editorMaterial.ui.valueColor')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'rankColors',
      get label() {
        return t('editorMaterial.ui.top3Colors')
      },
      type: 'textarea',
      default: '#fbbf24, #94a3b8, #b45309',
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.top3ColorsCommaSeparated')
      },
    },
    aggregatePropField,
  ],
  extraDefaults: {
    items: [
      { name: '北京', value: 1280 },
      { name: '上海', value: 960 },
      { name: '广州', value: 720 },
      { name: '深圳', value: 540 },
      { name: '杭州', value: 480 },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'categoryField',
      get label() {
        return t('editorMaterial.ui.categoryField')
      },
      type: 'category',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
    },
  ],
}

export default rankListDefinition

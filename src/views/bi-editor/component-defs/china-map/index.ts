import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const chinaMapDefinition: ComponentDefinition = {
  type: 'china-map',
  meta: {
    get name() {
      return t('editorMaterial.meta.chinaMap')
    },
    category: 'chart',
    icon: 'Location',
    defaultWidth: 500,
    defaultHeight: 400,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    {
      key: 'titleShow',
      get label() {
        return t('editorMaterial.ui.showTitle')
      },
      type: 'switch',
      default: false,
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
      default: t('editorMaterial.meta.chinaMap'),
      get group() {
        return t('editorMaterial.ui.title')
      },
      visibleWhen: { field: 'titleShow', truthy: true },
    },
    {
      key: 'mapColor',
      get label() {
        return t('editorMaterial.ui.regionColor')
      },
      type: 'colorpicker',
      default: '#1e293b',
      get group() {
        return t('editorMaterial.ui.region')
      },
      get tip() {
        return t('editorMaterial.ui.defaultMapRegionColor')
      },
    },
    {
      key: 'mapBorderColor',
      get label() {
        return t('editorMaterial.ui.provinceBorderColor')
      },
      type: 'colorpicker',
      default: '#475569',
      get group() {
        return t('editorMaterial.ui.region')
      },
      get tip() {
        return t('editorMaterial.ui.provinceBorderColor')
      },
    },
    {
      key: 'mapBorderWidth',
      get label() {
        return t('editorMaterial.ui.provinceBorderWidth')
      },
      type: 'slider',
      min: 0,
      max: 3,
      step: 0.5,
      default: 0.5,
      get group() {
        return t('editorMaterial.ui.region')
      },
    },
    {
      key: 'emphasisColor',
      get label() {
        return t('editorMaterial.ui.highlightColor2')
      },
      type: 'colorpicker',
      default: '#0e7490',
      get group() {
        return t('editorMaterial.ui.region')
      },
      get tip() {
        return t('editorMaterial.ui.highlightColor')
      },
    },
    {
      key: 'visualOn',
      get label() {
        return t('editorMaterial.ui.visualMapping')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.visualMapping')
      },
      get tip() {
        return t('editorMaterial.ui.colorByValue')
      },
    },
    {
      key: 'visualFrom',
      get label() {
        return t('editorMaterial.ui.lowValueColor')
      },
      type: 'colorpicker',
      default: '#fef3c7',
      get group() {
        return t('editorMaterial.ui.visualMapping')
      },
      get tip() {
        return t('editorMaterial.ui.lowValueColor')
      },
      visibleWhen: { field: 'visualOn', truthy: true },
    },
    {
      key: 'visualTo',
      get label() {
        return t('editorMaterial.ui.highValueColor')
      },
      type: 'colorpicker',
      default: '#dc2626',
      get group() {
        return t('editorMaterial.ui.visualMapping')
      },
      get tip() {
        return t('editorMaterial.ui.highValueColor')
      },
      visibleWhen: { field: 'visualOn', truthy: true },
    },
    {
      key: 'labelShow',
      get label() {
        return t('editorMaterial.ui.showLabel')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.label')
      },
      get tip() {
        return t('editorMaterial.ui.showProvinceNames')
      },
    },
    {
      key: 'labelColor',
      get label() {
        return t('editorMaterial.ui.labelColor2')
      },
      type: 'colorpicker',
      default: '#e2e8f0',
      get group() {
        return t('editorMaterial.ui.label')
      },
    },
  ],
  extraDefaults: {
    data: [
      { name: '北京', value: 54 },
      { name: '天津', value: 38 },
      { name: '河北', value: 79 },
      { name: '山西', value: 32 },
      { name: '内蒙古', value: 25 },
      { name: '辽宁', value: 58 },
      { name: '吉林', value: 30 },
      { name: '黑龙江', value: 34 },
      { name: '上海', value: 88 },
      { name: '江苏', value: 95 },
      { name: '浙江', value: 92 },
      { name: '安徽', value: 50 },
      { name: '福建', value: 62 },
      { name: '江西', value: 36 },
      { name: '山东', value: 86 },
      { name: '河南', value: 60 },
      { name: '湖北', value: 55 },
      { name: '湖南', value: 48 },
      { name: '广东', value: 98 },
      { name: '广西', value: 35 },
      { name: '海南', value: 18 },
      { name: '重庆', value: 42 },
      { name: '四川', value: 65 },
      { name: '贵州', value: 28 },
      { name: '云南', value: 40 },
      { name: '西藏', value: 8 },
      { name: '陕西', value: 45 },
      { name: '甘肃', value: 22 },
      { name: '青海', value: 12 },
      { name: '宁夏', value: 15 },
      { name: '新疆', value: 30 },
      { name: '台湾', value: 0 },
      { name: '香港', value: 0 },
      { name: '澳门', value: 0 },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'nameField',
      get label() {
        return t('editorMaterial.ui.regionNameField')
      },
      type: 'name',
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

export default chinaMapDefinition

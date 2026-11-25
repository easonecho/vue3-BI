import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

function getWordCloudDefaultWords() {
  return [
    { name: t('demoData.wordCloud.dataAnalysis'), value: 100 },
    { name: t('demoData.wordCloud.visualization'), value: 90 },
    { name: t('demoData.wordCloud.bigScreen'), value: 85 },
    { name: 'BI', value: 80 },
    { name: ' dashboard', value: 75 },
    { name: t('demoData.wordCloud.realtime'), value: 70 },
    { name: t('demoData.wordCloud.monitoring'), value: 65 },
    { name: t('demoData.wordCloud.alerting'), value: 60 },
    { name: t('demoData.wordCloud.trend'), value: 55 },
    { name: t('demoData.wordCloud.forecast'), value: 50 },
    { name: 'AI', value: 48 },
    { name: t('demoData.wordCloud.machineLearning'), value: 45 },
    { name: t('demoData.wordCloud.cloudNative'), value: 42 },
    { name: t('demoData.wordCloud.microservices'), value: 40 },
    { name: t('demoData.wordCloud.containerization'), value: 38 },
    { name: 'DevOps', value: 35 },
    { name: t('demoData.wordCloud.middlePlatform'), value: 32 },
    { name: t('demoData.wordCloud.lowCode'), value: 30 },
    { name: t('demoData.wordCloud.iot'), value: 28 },
    { name: '5G', value: 26 },
    { name: t('demoData.wordCloud.blockchain'), value: 24 },
    { name: t('demoData.wordCloud.metaverse'), value: 22 },
  ]
}

export const wordCloudDefinition: ComponentDefinition = {
  type: 'word-cloud',
  meta: {
    get name() {
      return t('editorMaterial.meta.wordCloud')
    },
    category: 'chart',
    icon: 'Histogram',
    defaultWidth: 400,
    defaultHeight: 300,
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
      default: t('editorMaterial.meta.wordCloud'),
      get group() {
        return t('editorMaterial.ui.title')
      },
      visibleWhen: { field: 'titleShow', truthy: true },
    },
    {
      key: 'minFontSize',
      get label() {
        return t('editorMaterial.ui.minFontSize')
      },
      type: 'slider',
      min: 10,
      max: 30,
      default: 12,
      get group() {
        return t('editorMaterial.ui.font')
      },
      get tip() {
        return t('editorMaterial.ui.minWordFontSize')
      },
    },
    {
      key: 'maxFontSize',
      get label() {
        return t('editorMaterial.ui.maxFontSize')
      },
      type: 'slider',
      min: 30,
      max: 80,
      default: 48,
      get group() {
        return t('editorMaterial.ui.font')
      },
      get tip() {
        return t('editorMaterial.ui.maxWordFontSize')
      },
    },
    {
      key: 'textColor',
      get label() {
        return t('editorMaterial.ui.primaryTextColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.primaryTextColor')
      },
    },
    {
      key: 'textColor2',
      get label() {
        return t('editorMaterial.ui.secondaryTextColor')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.secondaryTextColor')
      },
    },
    {
      key: 'textColor3',
      get label() {
        return t('editorMaterial.ui.auxiliaryTextColor')
      },
      type: 'colorpicker',
      default: '#a5f3fc',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.auxiliaryTextColor')
      },
    },
    {
      key: 'rotate',
      get label() {
        return t('editorMaterial.ui.allowRotation')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.layout')
      },
      get tip() {
        return t('editorMaterial.ui.allowRotation')
      },
    },
    {
      key: 'rotateAngles',
      get label() {
        return t('editorMaterial.ui.rotationAngle')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.090Degrees')
          },
          value: '0,90',
        },
        {
          get label() {
            return t('editorMaterial.ui.04590Degrees')
          },
          value: '0,45,90,135',
        },
        {
          get label() {
            return t('editorMaterial.ui.0DegreesOnly')
          },
          value: '0',
        },
        {
          get label() {
            return t('editorMaterial.ui.90DegreesOnly')
          },
          value: '90',
        },
      ],
      default: '0,90',
      get group() {
        return t('editorMaterial.ui.layout')
      },
    },
    {
      key: 'gridSize',
      get label() {
        return t('editorMaterial.ui.wordGap')
      },
      type: 'slider',
      min: 4,
      max: 20,
      default: 8,
      get group() {
        return t('editorMaterial.ui.layout')
      },
      get tip() {
        return t('editorMaterial.ui.wordGapPx')
      },
    },
  ],
  extraDefaults: {
    get words() {
      return getWordCloudDefaultWords()
    },
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'nameField',
      get label() {
        return t('editorMaterial.ui.wordField')
      },
      type: 'name',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.weightField')
      },
      type: 'value',
    },
  ],
}

export default wordCloudDefinition

import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const timelineDefinition: ComponentDefinition = {
  type: 'timeline',
  meta: {
    get name() {
      return t('editorMaterial.ui.timeAxis')
    },
    category: 'data',
    icon: 'Timer',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.title')
      },
      type: 'input',
      default: t('editorMaterial.ui.eventTimeline'),
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
      key: 'direction',
      get label() {
        return t('editorMaterial.ui.direction')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.vertical')
          },
          value: 'vertical',
        },
        {
          get label() {
            return t('editorMaterial.ui.horizontal')
          },
          value: 'horizontal',
        },
      ],
      default: 'vertical',
      get group() {
        return t('editorMaterial.ui.layout')
      },
    },
    {
      key: 'alternate',
      get label() {
        return t('editorMaterial.ui.staggered')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.layout')
      },
      get tip() {
        return t('editorMaterial.ui.inVerticalModeAlternateLeftAndRight')
      },
    },
    {
      key: 'dotColor',
      get label() {
        return t('editorMaterial.ui.dotColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'lineColor',
      get label() {
        return t('editorMaterial.ui.axisLineColor')
      },
      type: 'colorpicker',
      default: '#334155',
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
      max: 18,
      default: 12,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'titleColor',
      get label() {
        return t('editorMaterial.ui.titleColor')
      },
      type: 'colorpicker',
      default: '#e2e8f0',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'contentColor',
      get label() {
        return t('editorMaterial.ui.contentColor')
      },
      type: 'colorpicker',
      default: '#94a3b8',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'timeColor',
      get label() {
        return t('editorMaterial.ui.timeColor')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
  ],
  extraDefaults: {
    events: [
      { time: '2024-01-15 10:00', title: '项目启动', content: '完成需求评审与技术选型' },
      { time: '2024-02-20 14:30', title: '开发启动', content: '前端框架搭建完成' },
      { time: '2024-04-01 09:15', title: '内测发布', content: '核心功能开发完毕，开始内部测试' },
      { time: '2024-05-10 16:00', title: '正式上线', content: '通过验收，正式部署到生产环境' },
    ],
  },
  defaultStyle: {},
}

export default timelineDefinition

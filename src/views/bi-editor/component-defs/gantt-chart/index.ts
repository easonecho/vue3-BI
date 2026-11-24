import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 甘特图默认任务数据 */
export const GANTT_DEFAULT_TASKS = [
  { name: '需求分析', start: '2024-05-01', end: '2024-05-05', progress: 100 },
  { name: 'UI设计', start: '2024-05-04', end: '2024-05-10', progress: 80 },
  { name: '前端开发', start: '2024-05-08', end: '2024-05-20', progress: 60 },
  { name: '后端开发', start: '2024-05-08', end: '2024-05-22', progress: 55 },
  { name: '测试', start: '2024-05-18', end: '2024-05-28', progress: 20 },
  { name: '上线', start: '2024-05-28', end: '2024-05-30', progress: 0 },
]

export const ganttChartDefinition: ComponentDefinition = {
  type: 'gantt-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.ganttChart')
    },
    category: 'chart',
    icon: 'Calendar',
    defaultWidth: 600,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'barColor',
      get label() {
        return t('editorMaterial.ui.taskBarColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.taskBarColor')
      },
    },
    {
      key: 'barColor2',
      get label() {
        return t('editorMaterial.ui.alternatingColors')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.alternatingColors')
      },
    },
    {
      key: 'barHeight',
      get label() {
        return t('editorMaterial.ui.taskBarHeightPx')
      },
      type: 'slider',
      min: 10,
      max: 40,
      default: 20,
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t('editorMaterial.ui.taskBarHeightPx')
      },
    },
    {
      key: 'showLabel',
      get label() {
        return t('editorMaterial.ui.showTaskName')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.label')
      },
      get tip() {
        return t('editorMaterial.ui.showTaskName')
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
    {
      key: 'timeFormat',
      get label() {
        return t('editorMaterial.ui.xAxisTimeGranularity')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.day')
          },
          value: 'day',
        },
        {
          get label() {
            return t('editorMaterial.ui.hour')
          },
          value: 'hour',
        },
        {
          get label() {
            return t('editorMaterial.ui.month')
          },
          value: 'month',
        },
      ],
      default: 'day',
      get group() {
        return t('editorMaterial.ui.time')
      },
      get tip() {
        return t('editorMaterial.ui.xAxisTimeGranularity')
      },
    },
  ],
  extraDefaults: {
    tasks: GANTT_DEFAULT_TASKS,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'nameField',
      get label() {
        return t('editorMaterial.ui.taskNameField')
      },
      type: 'name',
    },
    {
      key: 'startField',
      get label() {
        return t('editorMaterial.ui.startTimeField')
      },
      type: 'category',
    },
    {
      key: 'endField',
      get label() {
        return t('editorMaterial.ui.endTimeField')
      },
      type: 'category',
    },
    {
      key: 'progressField',
      get label() {
        return t('editorMaterial.ui.progressField')
      },
      type: 'value',
    },
  ],
}

export default ganttChartDefinition

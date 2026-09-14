import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema } from '../types'

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
    name: '甘特图',
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
      label: '任务条颜色',
      type: 'colorpicker',
      default: '#22d3ee',
      group: '样式',
      tip: '任务条颜色',
    },
    {
      key: 'barColor2',
      label: '交替色',
      type: 'colorpicker',
      default: '#67e8f9',
      group: '样式',
      tip: '交替色',
    },
    {
      key: 'barHeight',
      label: '任务条高度(px)',
      type: 'slider',
      min: 10,
      max: 40,
      default: 20,
      group: '样式',
      tip: '任务条高度(px)',
    },
    {
      key: 'showLabel',
      label: '显示任务名',
      type: 'switch',
      default: true,
      group: '标签',
      tip: '显示任务名',
    },
    {
      key: 'labelColor',
      label: '标签颜色',
      type: 'colorpicker',
      default: '#e2e8f0',
      group: '标签',
    },
    {
      key: 'timeFormat',
      label: 'X轴时间粒度',
      type: 'select',
      options: [
        { label: '日', value: 'day' },
        { label: '时', value: 'hour' },
        { label: '月', value: 'month' },
      ],
      default: 'day',
      group: '时间',
      tip: 'X轴时间粒度',
    },
  ],
  extraDefaults: {
    tasks: GANTT_DEFAULT_TASKS,
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default ganttChartDefinition

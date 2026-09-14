import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const timelineDefinition: ComponentDefinition = {
  type: 'timeline',
  meta: {
    name: '时间轴',
    category: 'data',
    icon: 'Timer',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  widget: Widget,
  propsSchema: [
    { key: 'title', label: '标题', type: 'input', default: '事件时间轴', group: '内容' },
    { key: 'showTitle', label: '显示标题', type: 'switch', default: true, group: '内容' },
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      options: [
        { label: '垂直', value: 'vertical' },
        { label: '水平', value: 'horizontal' },
      ],
      default: 'vertical',
      group: '布局',
    },
    { key: 'alternate', label: '交错显示', type: 'switch', default: true, group: '布局', tip: '垂直模式交错左右显示' },
    { key: 'dotColor', label: '圆点颜色', type: 'colorpicker', default: '#22d3ee', group: '样式' },
    { key: 'lineColor', label: '轴线颜色', type: 'colorpicker', default: '#334155', group: '样式' },
    { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 18, default: 12, group: '字体' },
    { key: 'titleColor', label: '标题颜色', type: 'colorpicker', default: '#e2e8f0', group: '字体' },
    { key: 'contentColor', label: '内容颜色', type: 'colorpicker', default: '#94a3b8', group: '字体' },
    { key: 'timeColor', label: '时间颜色', type: 'colorpicker', default: '#67e8f9', group: '字体' },
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

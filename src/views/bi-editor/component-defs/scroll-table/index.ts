import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const scrollTableDefinition: ComponentDefinition = {
  type: 'scroll-table',
  meta: {
    name: '轮播表格',
    category: 'data',
    icon: 'List',
    defaultWidth: 500,
    defaultHeight: 280,
  },
  widget: Widget,
  propsSchema: [
    { key: 'showHeader', label: '显示表头', type: 'switch', default: true, group: '外观' },
    { key: 'stripe', label: '斑马纹', type: 'switch', default: true, group: '外观' },
    { key: 'border', label: '显示边框', type: 'switch', default: true, group: '外观' },
    { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 18, default: 12, group: '字体' },
    { key: 'headerBg', label: '表头背景', type: 'colorpicker', default: '#1e293b', group: '表头' },
    { key: 'headerColor', label: '表头文字', type: 'colorpicker', default: '#67e8f9', group: '表头' },
    { key: 'rowColor', label: '行文字', type: 'colorpicker', default: '#e2e8f0', group: '行' },
    {
      key: 'rowBgColor',
      label: '行背景',
      type: 'colorpicker',
      default: 'rgba(15,23,42,0.6)',
      group: '行',
    },
    {
      key: 'rowHoverBg',
      label: '行悬停背景',
      type: 'colorpicker',
      default: 'rgba(34,211,238,0.15)',
      group: '行',
    },
    { key: 'autoScroll', label: '自动滚动', type: 'switch', default: true, group: '轮播', tip: '自动滚动' },
    {
      key: 'interval',
      label: '滚动间隔',
      type: 'slider',
      min: 1000,
      max: 10000,
      step: 500,
      default: 2000,
      group: '轮播',
      tip: '滚动间隔(ms)',
    },
    {
      key: 'step',
      label: '滚动行数',
      type: 'slider',
      min: 1,
      max: 5,
      default: 1,
      group: '轮播',
      tip: '每次滚动行数',
    },
    {
      key: 'pauseOnHover',
      label: '悬停暂停',
      type: 'switch',
      default: true,
      group: '轮播',
      tip: '鼠标悬停暂停',
    },
  ],
  extraDefaults: {
    columns: [
      { key: 'time', title: '时间', width: 160 },
      { key: 'level', title: '级别', width: 80 },
      { key: 'source', title: '来源', width: 120 },
      { key: 'message', title: '告警信息' },
    ],
    data: [
      { time: '2024-05-20 10:23:15', level: '严重', source: 'DB-Server', message: '数据库连接数超过阈值' },
      { time: '2024-05-20 10:21:08', level: '警告', source: 'App-Server', message: 'CPU 使用率 85%' },
      { time: '2024-05-20 10:18:42', level: '严重', source: 'Redis', message: '内存溢出风险' },
      { time: '2024-05-20 10:15:30', level: '提示', source: 'Nginx', message: '配置文件已更新' },
      { time: '2024-05-20 10:12:11', level: '警告', source: 'MQ', message: '消息积压 1000+' },
      { time: '2024-05-20 10:08:55', level: '严重', source: 'Storage', message: '磁盘剩余空间 < 10%' },
      { time: '2024-05-20 10:05:20', level: '提示', source: 'Monitor', message: '监控 agent 已重启' },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default scrollTableDefinition

import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const rankListDefinition: ComponentDefinition = {
  type: 'rank-list',
  meta: {
    name: '排行榜',
    category: 'data',
    icon: 'Rank',
    defaultWidth: 300,
    defaultHeight: 280,
  },
  widget: Widget,
  propsSchema: [
    { key: 'title', label: '标题', type: 'input', default: '排行榜', group: '内容' },
    { key: 'showTitle', label: '显示标题', type: 'switch', default: true, group: '内容' },
    { key: 'top', label: '显示前N项', type: 'number', default: 5, min: 1, max: 20, group: '内容', tip: '显示前 N 项' },
    { key: 'barColor', label: '进度条颜色', type: 'colorpicker', default: '#22d3ee', group: '样式' },
    { key: 'barBgColor', label: '进度条背景', type: 'colorpicker', default: '#1e293b', group: '样式' },
    { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 20, default: 12, group: '字体' },
    { key: 'nameColor', label: '名称颜色', type: 'colorpicker', default: '#e2e8f0', group: '字体' },
    { key: 'valueColor', label: '数值颜色', type: 'colorpicker', default: '#67e8f9', group: '字体' },
    { key: 'rankColors', label: '前3名颜色', type: 'textarea', default: '#fbbf24, #94a3b8, #b45309', group: '样式', tip: '前3名颜色，逗号分隔' },
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
}

export default rankListDefinition

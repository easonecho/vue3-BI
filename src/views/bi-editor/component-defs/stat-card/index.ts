import type { ComponentDefinition } from '../types'
import { aggregatePropField } from '../types'
import Widget from './Widget.vue'

export const statCardDefinition: ComponentDefinition = {
  type: 'stat-card',
  meta: {
    name: '统计卡片',
    category: 'info',
    icon: 'Histogram',
    defaultWidth: 240,
    defaultHeight: 120,
  },
  widget: Widget,
  propsSchema: [
    { key: 'title', label: '标题', type: 'input', default: '总销售额', group: '内容' },
    { key: 'value', label: '数值', type: 'input', default: '¥126,560', group: '内容' },
    { key: 'prefix', label: '前缀', type: 'input', default: '', group: '内容' },
    { key: 'suffix', label: '后缀', type: 'input', default: '', group: '内容' },
    {
      key: 'trend',
      label: '趋势',
      type: 'select',
      options: [
        { label: '上升', value: 'up' },
        { label: '下降', value: 'down' },
        { label: '持平', value: 'flat' },
      ],
      default: 'up',
      group: '内容',
    },
    { key: 'trendValue', label: '趋势值', type: 'input', default: '+12.5%', group: '内容' },
    {
      key: 'iconName',
      label: '图标名',
      type: 'input',
      default: 'TrendCharts',
      group: '内容',
      tip: 'Element Plus 图标名',
    },
    { key: 'bgColor', label: '背景色', type: 'colorpicker', default: '#ffffff', group: '样式' },
    { key: 'textColor', label: '文字颜色', type: 'colorpicker', default: '#1f2937', group: '样式' },
    { key: 'titleColor', label: '标题颜色', type: 'colorpicker', default: '#6b7280', group: '样式' },
    { key: 'accentColor', label: '强调色', type: 'colorpicker', default: '#5470c6', group: '样式' },
    { key: 'fontSize', label: '数值字号', type: 'number', min: 12, max: 48, default: 24, group: '样式' },
    { key: 'borderRadius', label: '圆角', type: 'number', min: 0, max: 24, default: 8, group: '样式' },
    { key: 'showIcon', label: '显示图标', type: 'switch', default: true, group: '样式' },
    aggregatePropField,
  ],
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'valueField', label: '数值字段', type: 'value' },
  ],
}

export default statCardDefinition

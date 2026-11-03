import type { ComponentDefinition } from '../types'
import { aggregatePropField } from '../types'
import Widget from './Widget.vue'

export const kpiCardDefinition: ComponentDefinition = {
  type: 'kpi-card',
  meta: {
    name: 'KPI卡片',
    category: 'info',
    icon: 'Histogram',
    defaultWidth: 280,
    defaultHeight: 140,
  },
  widget: Widget,
  propsSchema: [
    // ============ 内容 ============
    { key: 'title', label: '标题', type: 'input', default: '月度营收', group: '内容' },
    { key: 'value', label: '主指标值', type: 'input', default: '¥1,256,800', group: '内容' },
    { key: 'target', label: '目标值', type: 'input', default: '¥1,500,000', group: '内容' },
    { key: 'unit', label: '单位', type: 'input', default: '', group: '内容' },
    {
      key: 'trend',
      label: '趋势方向',
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
    { key: 'trendLabel', label: '趋势标签', type: 'input', default: '同比', group: '内容' },
    {
      key: 'sparkData',
      label: '迷你折线数据',
      type: 'json',
      default: [120, 200, 150, 80, 70, 110, 130, 180],
      group: '内容',
      tip: 'mini spark 折线数据，数字数组',
    },
    aggregatePropField,
    // ============ 样式 ============
    { key: 'showProgress', label: '显示达成率进度条', type: 'switch', default: true, group: '样式' },
    { key: 'showSpark', label: '显示迷你折线', type: 'switch', default: true, group: '样式' },
    { key: 'bgColor', label: '背景色', type: 'colorpicker', default: '#fff', group: '样式' },
    { key: 'textColor', label: '主文字颜色', type: 'colorpicker', default: '#1f2937', group: '样式' },
    { key: 'titleColor', label: '标题颜色', type: 'colorpicker', default: '#6b7280', group: '样式' },
    { key: 'accentColor', label: '强调色', type: 'colorpicker', default: '#5470c6', group: '样式' },
    { key: 'trendUpColor', label: '上升色', type: 'colorpicker', default: '#2ec07e', group: '样式' },
    { key: 'trendDownColor', label: '下降色', type: 'colorpicker', default: '#ee6666', group: '样式' },
    { key: 'progressColor', label: '进度条颜色', type: 'colorpicker', default: '#5470c6', group: '样式' },
    { key: 'fontSize', label: '数值字号', type: 'number', min: 12, max: 48, default: 28, group: '样式' },
    { key: 'borderRadius', label: '圆角', type: 'number', min: 0, max: 24, default: 8, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'valueField', label: '数值字段', type: 'value' },
    { key: 'sparkField', label: '迷你折线字段', type: 'value' },
  ],
}

export default kpiCardDefinition

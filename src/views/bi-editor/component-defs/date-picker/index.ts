import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const datePickerDefinition: ComponentDefinition = {
  type: 'date-picker',
  meta: {
    name: '日期选择器',
    category: 'data',
    icon: 'Calendar',
    defaultWidth: 220,
    defaultHeight: 40,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'mode',
      label: '类型',
      type: 'select',
      options: [
        { label: '日期', value: 'date' },
        { label: '时间', value: 'time' },
        { label: '日期时间', value: 'datetime' },
      ],
      default: 'date',
      group: '类型',
    },
    {
      key: 'placeholder',
      label: '占位文字',
      type: 'input',
      default: '选择日期',
      group: '内容',
    },
    {
      key: 'defaultValue',
      label: '默认值',
      type: 'input',
      default: '',
      group: '内容',
      tip: '默认值，格式 YYYY-MM-DD 或 HH:mm 或 YYYY-MM-DDTHH:mm',
    },
    {
      key: 'showLabel',
      label: '显示左侧标签',
      type: 'switch',
      default: true,
      group: '外观',
      tip: '显示左侧标签',
    },
    {
      key: 'labelText',
      label: '标签文字',
      type: 'input',
      default: '日期',
      group: '外观',
    },
    { key: 'bgColor', label: '背景颜色', type: 'colorpicker', default: '#1e293b', group: '颜色' },
    { key: 'textColor', label: '文字颜色', type: 'colorpicker', default: '#e2e8f0', group: '颜色' },
    {
      key: 'borderColor',
      label: '边框颜色',
      type: 'colorpicker',
      default: '#475569',
      group: '颜色',
    },
    {
      key: 'accentColor',
      label: '强调色',
      type: 'colorpicker',
      default: '#22d3ee',
      group: '颜色',
      tip: '聚焦色',
    },
    { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 18, default: 13, group: '字体' },
    { key: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 20, default: 4, group: '样式' },
  ],
  defaultStyle: {},
}

export default datePickerDefinition

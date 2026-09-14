import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const clockDefinition: ComponentDefinition = {
  type: 'clock',
  meta: {
    name: '实时时钟',
    category: 'info',
    icon: 'Clock',
    defaultWidth: 200,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    { key: 'showDate', label: '显示日期', type: 'switch', default: true, group: '显示', tip: '显示日期' },
    { key: 'showWeek', label: '显示星期', type: 'switch', default: true, group: '显示', tip: '显示星期' },
    { key: 'showSeconds', label: '显示秒', type: 'switch', default: true, group: '显示', tip: '显示秒' },
    { key: 'format24', label: '24小时制', type: 'switch', default: true, group: '显示', tip: '24小时制' },
    { key: 'fontSize', label: '时间字号', type: 'slider', min: 14, max: 60, default: 32, group: '字体' },
    { key: 'dateFontSize', label: '日期字号', type: 'slider', min: 10, max: 24, default: 14, group: '字体' },
    { key: 'color', label: '时间颜色', type: 'colorpicker', default: '#ffffff', group: '字体' },
    { key: 'weekColor', label: '星期颜色', type: 'colorpicker', default: '#94a3b8', group: '字体' },
    {
      key: 'fontWeight',
      label: '字重',
      type: 'select',
      options: [
        { label: '常规', value: 'normal' },
        { label: '粗体', value: 'bold' },
        { label: '细体', value: 'lighter' },
      ],
      default: 'bold',
      group: '字体',
    },
    {
      key: 'fontFamily',
      label: '字体',
      type: 'select',
      options: [
        { label: '等宽', value: 'Consolas, "Courier New", monospace' },
        { label: '默认', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      ],
      default: 'Consolas, "Courier New", monospace',
      group: '字体',
    },
  ],
  defaultStyle: {},
}

export default clockDefinition

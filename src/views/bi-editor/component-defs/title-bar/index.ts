import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const titleBarDefinition: ComponentDefinition = {
  type: 'title-bar',
  meta: {
    name: '标题栏',
    category: 'basic',
    icon: 'Flag',
    defaultWidth: 500,
    defaultHeight: 60,
  },
  widget: Widget,
  propsSchema: [
    { key: 'title', label: '主标题', type: 'textarea', default: '数据可视化大屏', group: '内容' },
    { key: 'subtitle', label: '副标题', type: 'input', default: 'DATA VISUALIZATION', group: '内容' },
    { key: 'showDecor', label: '显示装饰线', type: 'switch', default: true, group: '装饰', tip: '是否显示两侧装饰横线' },
    { key: 'fontSize', label: '主标题字号', type: 'slider', min: 14, max: 48, default: 24, group: '字体' },
    { key: 'subtitleFontSize', label: '副标题字号', type: 'slider', min: 10, max: 24, default: 12, group: '字体' },
    { key: 'color', label: '主标题颜色', type: 'colorpicker', default: '#ffffff', group: '字体' },
    { key: 'subtitleColor', label: '副标题颜色', type: 'colorpicker', default: '#67e8f9', group: '字体' },
    {
      key: 'fontWeight',
      label: '字重',
      type: 'select',
      options: [
        { label: '常规', value: 'normal' },
        { label: '粗体', value: 'bold' },
      ],
      default: 'bold',
      group: '字体',
    },
    { key: 'decorColor', label: '装饰线颜色', type: 'colorpicker', default: '#22d3ee', group: '装饰' },
    { key: 'decorWidth', label: '装饰线长度', type: 'slider', min: 0, max: 200, default: 80, group: '装饰', tip: '装饰横线长度' },
    { key: 'bgFrom', label: '背景起始色', type: 'colorpicker', default: '#0f172a', group: '背景', tip: '背景渐变起始色' },
    { key: 'bgTo', label: '背景结束色', type: 'colorpicker', default: '#1e293b', group: '背景', tip: '背景渐变结束色' },
  ],
  defaultStyle: {},
}

export default titleBarDefinition

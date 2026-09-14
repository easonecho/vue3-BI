import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const flipNumberDefinition: ComponentDefinition = {
  type: 'flip-number',
  meta: {
    name: '数字翻牌器',
    category: 'info',
    icon: 'Odometer',
    defaultWidth: 160,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    { key: 'value', label: '目标数值', type: 'number', default: 0, group: '数据', tip: '目标数值' },
    { key: 'decimals', label: '小数位数', type: 'slider', min: 0, max: 3, default: 0, group: '数据', tip: '小数位数' },
    { key: 'prefix', label: '前缀', type: 'input', default: '', group: '数据', tip: '前缀，如 ¥' },
    { key: 'suffix', label: '后缀', type: 'input', default: '', group: '数据', tip: '后缀，如 %' },
    { key: 'duration', label: '动画时长', type: 'slider', min: 500, max: 5000, step: 100, default: 1500, group: '动画', tip: '翻牌动画时长(ms)' },
    { key: 'separator', label: '千分位分隔符', type: 'switch', default: true, group: '格式', tip: '千分位分隔符' },
    { key: 'fontSize', label: '字号', type: 'slider', min: 20, max: 96, default: 40, group: '字体' },
    { key: 'color', label: '颜色', type: 'colorpicker', default: '#22d3ee', group: '字体' },
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
    { key: 'flipColor', label: '翻牌阴影色', type: 'colorpicker', default: '#0e7490', group: '动画', tip: '翻牌时阴影色' },
  ],
  defaultStyle: {},
}

export default flipNumberDefinition

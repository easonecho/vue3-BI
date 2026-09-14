import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const decorBorderDefinition: ComponentDefinition = {
  type: 'decor-border',
  meta: {
    name: '装饰边框',
    category: 'basic',
    icon: 'Box',
    defaultWidth: 300,
    defaultHeight: 200,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'bgImage',
      label: '背景图素材',
      type: 'asset',
      assetType: 'image',
      default: '',
      group: '源',
      tip: '可选：从素材库选择背景图（在样式背景之上）',
    },
    {
      key: 'style',
      label: '样式',
      type: 'select',
      options: [
        { label: '科技角', value: 'corner' },
        { label: '流光边', value: 'flow' },
        { label: '网格', value: 'grid' },
        { label: '简洁', value: 'simple' },
      ],
      default: 'corner',
      group: '样式',
    },
    { key: 'borderColor', label: '边框颜色', type: 'colorpicker', default: '#22d3ee', group: '颜色' },
    { key: 'cornerColor', label: '角标颜色', type: 'colorpicker', default: '#67e8f9', group: '颜色', tip: '角标颜色' },
    { key: 'bgColor', label: '背景颜色', type: 'colorpicker', default: 'rgba(15,23,42,0.4)', group: '颜色' },
    { key: 'borderWidth', label: '边框宽度', type: 'slider', min: 1, max: 6, default: 2, group: '线条' },
    { key: 'cornerSize', label: '角标尺寸', type: 'slider', min: 8, max: 30, default: 16, group: '角标' },
    { key: 'showCorner', label: '显示角标', type: 'switch', default: true, group: '角标', tip: '显示四角装饰' },
  ],
  defaultStyle: {},
}

export default decorBorderDefinition

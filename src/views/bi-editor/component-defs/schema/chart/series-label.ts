import type { PropField } from '../props'
import { DEFAULT_FONT_FAMILY, FONT_FAMILY_OPTIONS, FONT_STYLE_OPTIONS, FONT_WEIGHT_OPTIONS } from '../options'

/**
 * 🔑 系列标签通用配置（每个图表的系列 label 文本样式）
 *   使用方式：每个图表的 propsSchema 末尾 [...buildSeriesLabelSchema(defaultPosition)] 合并
 */
export function buildSeriesLabelSchema(defaultPosition: string = 'top'): PropField[] {
  return [
    {
      key: 'seriesLabelFontFamily',
      label: '字体',
      type: 'select',
      options: [...FONT_FAMILY_OPTIONS],
      default: DEFAULT_FONT_FAMILY,
      group: '系列标签',
    },
    {
      key: 'seriesLabelFontSize',
      label: '字号',
      type: 'slider',
      min: 10,
      max: 36,
      default: 12,
      group: '系列标签',
    },
    {
      key: 'seriesLabelFontWeight',
      label: '字重',
      type: 'select',
      options: [...FONT_WEIGHT_OPTIONS],
      default: 'normal',
      group: '系列标签',
    },
    {
      key: 'seriesLabelFontStyle',
      label: '样式（斜体）',
      type: 'select',
      options: [...FONT_STYLE_OPTIONS],
      default: 'normal',
      group: '系列标签',
    },
    {
      key: 'seriesLabelColor',
      label: '文字颜色',
      type: 'colorpicker',
      default: '#6b7280',
      group: '系列标签',
    },
    {
      key: 'seriesLabelPosition',
      label: '标签位置',
      type: 'select',
      options: [
        { label: '顶部', value: 'top' },
        { label: '内部顶部', value: 'insideTop' },
        { label: '居中', value: 'inside' },
        { label: '内部底部', value: 'insideBottom' },
        { label: '底部', value: 'bottom' },
        { label: '左侧', value: 'left' },
        { label: '右侧', value: 'right' },
      ],
      default: defaultPosition,
      group: '系列标签',
    },
  ]
}

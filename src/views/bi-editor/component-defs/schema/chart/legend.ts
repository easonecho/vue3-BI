import type { PropField } from '../props'
import { DEFAULT_FONT_FAMILY, FONT_FAMILY_OPTIONS, FONT_STYLE_OPTIONS, FONT_WEIGHT_OPTIONS } from '../options'

/** 🔑 图表图例配置 Schema（chartCommonSchema 的「图例」分组） */
export const chartLegendSchema: PropField[] = [
  // ============ 图例 ============
  { key: 'legendShow', label: '显示图例', type: 'switch', default: true, group: '图例' },
  {
    key: 'legendPosition',
    label: '图例位置',
    type: 'select',
    options: [
      { label: '顶部', value: 'top' },
      { label: '底部', value: 'bottom' },
      { label: '左侧', value: 'left' },
      { label: '右侧', value: 'right' },
    ],
    default: 'bottom',
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendItemGap',
    label: '图例间距',
    type: 'slider',
    min: 0,
    max: 60,
    default: 16,
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontFamily',
    label: '字体',
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontSize',
    label: '字号',
    type: 'slider',
    min: 10,
    max: 24,
    default: 12,
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontWeight',
    label: '字重',
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'normal',
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontStyle',
    label: '样式（斜体）',
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendColor',
    label: '文字颜色',
    type: 'colorpicker',
    default: '#6b7280',
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
]

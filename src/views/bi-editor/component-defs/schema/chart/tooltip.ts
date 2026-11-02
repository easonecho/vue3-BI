import type { PropField } from '../props'
import { DEFAULT_FONT_FAMILY, FONT_FAMILY_OPTIONS, FONT_STYLE_OPTIONS, FONT_WEIGHT_OPTIONS } from '../options'

/** 🔑 图表提示框配置 Schema（chartCommonSchema 的「提示框」分组） */
export const chartTooltipSchema: PropField[] = [
  // ============ 提示框 Tooltip ============
  { key: 'tooltipShow', label: '启用提示框', type: 'switch', default: true, group: '提示框' },
  {
    key: 'tooltipTrigger',
    label: '触发类型',
    type: 'select',
    options: [
      { label: '数据项触发', value: 'item' },
      { label: '坐标轴触发', value: 'axis' },
      { label: '不触发', value: 'none' },
    ],
    default: 'item',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipBgColor',
    label: '背景颜色',
    type: 'colorpicker',
    default: '#ffffff',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipBorderColor',
    label: '边框颜色',
    type: 'colorpicker',
    default: '#e5e7eb',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontFamily',
    label: '字体',
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontSize',
    label: '字号',
    type: 'slider',
    min: 10,
    max: 20,
    default: 12,
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontWeight',
    label: '字重',
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'normal',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextFontStyle',
    label: '样式（斜体）',
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextColor',
    label: '文字颜色',
    type: 'colorpicker',
    default: '#374151',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
]

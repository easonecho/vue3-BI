import type { PropField } from '../props'
import { DEFAULT_FONT_FAMILY, FONT_FAMILY_OPTIONS, FONT_STYLE_OPTIONS, FONT_WEIGHT_OPTIONS } from '../options'

/** 🔑 图表标题配置 Schema（chartCommonSchema 的「标题」分组） */
export const chartTitleSchema: PropField[] = [
  // ============ 标题 ============
  { key: 'titleShow', label: '显示标题', type: 'switch', default: true, group: '标题' },
  {
    key: 'titleText',
    label: '标题文本',
    type: 'input',
    default: '',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleLeft',
    label: '水平位置',
    type: 'select',
    options: [
      { label: '左对齐', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右对齐', value: 'right' },
    ],
    default: 'center',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleTop',
    label: '垂直位置',
    type: 'select',
    options: [
      { label: '顶部', value: 'top' },
      { label: '居中', value: 'middle' },
      { label: '底部', value: 'bottom' },
    ],
    default: 'top',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontSize',
    label: '字号',
    type: 'slider',
    min: 10,
    max: 48,
    default: 14,
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontFamily',
    label: '字体',
    type: 'select',
    options: [...FONT_FAMILY_OPTIONS],
    default: DEFAULT_FONT_FAMILY,
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontWeight',
    label: '字重',
    type: 'select',
    options: [...FONT_WEIGHT_OPTIONS],
    default: 'bold',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontStyle',
    label: '样式（斜体）',
    type: 'select',
    options: [...FONT_STYLE_OPTIONS],
    default: 'normal',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleColor',
    label: '文字颜色',
    type: 'colorpicker',
    default: '#1f2937',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
]

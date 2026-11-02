import type { PropField } from './props'

/** 基础文本 Schema（可被其他文本类组件复用） */
export const textBaseSchema: PropField[] = [
  { key: 'text', label: '文本内容', type: 'textarea', default: '文本内容' },
  { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 72, default: 14, group: '字体' },
  {
    key: 'fontWeight',
    label: '字重',
    type: 'select',
    options: [
      { label: '常规', value: 'normal' },
      { label: '粗体', value: 'bold' },
    ],
    default: 'normal',
    group: '字体',
  },
  { key: 'color', label: '颜色', type: 'colorpicker', default: '#333333', group: '字体' },
  {
    key: 'textAlign',
    label: '对齐',
    type: 'select',
    options: [
      { label: '左对齐', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右对齐', value: 'right' },
    ],
    default: 'left',
    group: '字体',
  },
  {
    key: 'lineHeight',
    label: '行高',
    type: 'slider',
    min: 1,
    max: 3,
    step: 0.1,
    default: 1.5,
    group: '字体',
  },
]

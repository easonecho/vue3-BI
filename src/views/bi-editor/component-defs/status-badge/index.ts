import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const statusBadgeDefinition: ComponentDefinition = {
  type: 'status-badge',
  meta: {
    name: '状态徽章',
    category: 'info',
    icon: 'CircleCheck',
    defaultWidth: 120,
    defaultHeight: 32,
  },
  widget: Widget,
  propsSchema: [
    // ============ 内容 ============
    { key: 'text', label: '文本', type: 'input', default: '运行中', group: '内容' },
    {
      key: 'status',
      label: '状态类型',
      type: 'select',
      options: [
        { label: '成功 (success)', value: 'success' },
        { label: '警告 (warning)', value: 'warning' },
        { label: '危险 (danger)', value: 'danger' },
        { label: '信息 (info)', value: 'info' },
        { label: '主要 (primary)', value: 'primary' },
      ],
      default: 'success',
      group: '内容',
    },
    {
      key: 'iconName',
      label: '图标名',
      type: 'input',
      default: '',
      group: '内容',
      tip: 'Element Plus 图标名，留空则不显示图标',
    },
    // ============ 样式 ============
    { key: 'showDot', label: '显示圆点', type: 'switch', default: true, group: '样式' },
    { key: 'dotPulse', label: '圆点闪烁', type: 'switch', default: false, group: '样式' },
    { key: 'fontSize', label: '字号', type: 'number', min: 12, max: 32, default: 14, group: '样式' },
    { key: 'successColor', label: '成功色', type: 'colorpicker', default: '#2ec07e', group: '样式' },
    { key: 'warningColor', label: '警告色', type: 'colorpicker', default: '#fac858', group: '样式' },
    { key: 'dangerColor', label: '危险色', type: 'colorpicker', default: '#ee6666', group: '样式' },
    { key: 'infoColor', label: '信息色', type: 'colorpicker', default: '#909399', group: '样式' },
    { key: 'primaryColor', label: '主要色', type: 'colorpicker', default: '#5470c6', group: '样式' },
    { key: 'solid', label: '实底色', type: 'switch', default: false, group: '样式', tip: 'true=实底色白字，false=淡色背景同色文字' },
    { key: 'rounded', label: '圆角', type: 'switch', default: true, group: '样式' },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default statusBadgeDefinition

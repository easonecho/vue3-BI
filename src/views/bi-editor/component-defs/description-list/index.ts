import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const descriptionListDefinition: ComponentDefinition = {
  type: 'description-list',
  meta: {
    name: '描述列表',
    category: 'data',
    icon: 'Document',
    defaultWidth: 400,
    defaultHeight: 200,
  },
  widget: Widget,
  propsSchema: [
    { key: 'title', label: '标题', type: 'input', default: '设备详情', group: '内容' },
    // ============ 样式 ============
    { key: 'columns', label: '每行列数', type: 'number', min: 1, max: 4, default: 2, group: '样式' },
    { key: 'bordered', label: '显示边框', type: 'switch', default: true, group: '样式' },
    { key: 'striped', label: '斑马纹', type: 'switch', default: false, group: '样式' },
    { key: 'labelWidth', label: '标签列宽', type: 'number', min: 80, max: 240, default: 120, group: '样式' },
    { key: 'labelColor', label: '标签颜色', type: 'colorpicker', default: '#6b7280', group: '样式' },
    { key: 'valueColor', label: '值颜色', type: 'colorpicker', default: '#1f2937', group: '样式' },
    { key: 'bgColor', label: '背景色', type: 'colorpicker', default: '#fff', group: '样式' },
    { key: 'borderColor', label: '边框颜色', type: 'colorpicker', default: '#e5e7eb', group: '样式' },
    { key: 'fontSize', label: '字号', type: 'number', min: 12, max: 20, default: 14, group: '样式' },
    { key: 'titleColor', label: '标题颜色', type: 'colorpicker', default: '#1f2937', group: '样式' },
    { key: 'titleFontSize', label: '标题字号', type: 'number', min: 12, max: 24, default: 16, group: '样式' },
  ],
  extraDefaults: {
    items: [
      { label: '设备名称', value: '服务器-01' },
      { label: 'IP地址', value: '192.168.1.100' },
      { label: '状态', value: '运行中' },
      { label: 'CPU', value: '45%' },
      { label: '内存', value: '8.2 GB' },
      { label: '位置', value: '机房A-机柜3' },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'labelField', label: '标签字段', type: 'category' },
    { key: 'valueField', label: '值字段', type: 'value' },
  ],
}

export default descriptionListDefinition

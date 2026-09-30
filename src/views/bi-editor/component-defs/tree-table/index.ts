import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const treeTableDefinition: ComponentDefinition = {
  type: 'tree-table',
  meta: {
    name: '树表格',
    category: 'data',
    icon: 'Grid',
    defaultWidth: 500,
    defaultHeight: 320,
  },
  widget: Widget,
  propsSchema: [
    // ============ 样式 ============
    { key: 'showIndex', label: '显示序号', type: 'switch', default: false, group: '样式' },
    { key: 'bordered', label: '显示边框', type: 'switch', default: true, group: '样式' },
    { key: 'striped', label: '斑马纹', type: 'switch', default: true, group: '样式' },
    { key: 'headerColor', label: '表头文字色', type: 'colorpicker', default: '#1f2937', group: '样式' },
    { key: 'headerBgColor', label: '表头背景色', type: 'colorpicker', default: '#f3f4f6', group: '样式' },
    { key: 'rowColor', label: '行文字色', type: 'colorpicker', default: '#1f2937', group: '样式' },
    { key: 'borderColor', label: '边框颜色', type: 'colorpicker', default: '#e5e7eb', group: '样式' },
    { key: 'fontSize', label: '字号', type: 'number', min: 12, max: 18, default: 13, group: '样式' },
    { key: 'rowHeight', label: '行高', type: 'number', min: 28, max: 60, default: 36, group: '样式' },
    { key: 'expandAll', label: '默认展开全部', type: 'switch', default: true, group: '样式' },
    { key: 'indentSize', label: '缩进像素', type: 'number', min: 8, max: 40, default: 16, group: '样式' },
  ],
  extraDefaults: {
    columns: [
      { key: 'name', label: '名称' },
      { key: 'count', label: '数量' },
      { key: 'status', label: '状态' },
    ],
    data: [
      {
        id: 1,
        name: '总部',
        count: 100,
        status: '正常',
        children: [
          { id: 2, name: '技术部', count: 50, status: '正常' },
          {
            id: 3,
            name: '市场部',
            count: 30,
            status: '正常',
            children: [
              { id: 4, name: '国内组', count: 18, status: '正常' },
              { id: 5, name: '海外组', count: 12, status: '停用' },
            ],
          },
          { id: 6, name: '财务部', count: 20, status: '正常' },
        ],
      },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: false,
}

export default treeTableDefinition

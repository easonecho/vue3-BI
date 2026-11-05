/**
 * 全局筛选器组件定义
 * 下拉选择器, 选中后广播值到其他图表组件
 */
import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'

export const filterDefinition: ComponentDefinition = {
  type: 'filter',
  meta: {
    name: '筛选器',
    category: 'data',
    icon: 'Filter',
    defaultWidth: 240,
    defaultHeight: 60,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    { key: 'title', label: '标题', type: 'input', default: '请选择', group: '基础' },
    {
      key: 'filterKey',
      label: '筛选字段（未绑定数据集时手写）',
      type: 'input',
      default: 'region',
      group: '基础',
    },
    {
      key: 'filterType',
      label: '类型',
      type: 'select',
      default: 'select',
      group: '基础',
      options: [
        { label: '下拉单选', value: 'select' },
        { label: '下拉多选', value: 'multi-select' },
        { label: '日期', value: 'date' },
        { label: '日期范围', value: 'date-range' },
      ],
    },
    { key: 'placeholder', label: '占位文字', type: 'input', default: '请选择', group: '基础' },
    {
      key: 'defaultRelative',
      label: '日期范围默认相对区间（每次打开按当天滚动）',
      type: 'select',
      default: 'none',
      group: '基础',
      options: [
        { label: '不设置', value: 'none' },
        { label: '今天', value: 'today' },
        { label: '昨天', value: 'yesterday' },
        { label: '最近 7 天', value: 'last7days' },
        { label: '最近 30 天', value: 'last30days' },
        { label: '本月', value: 'thisMonth' },
        { label: '上月', value: 'lastMonth' },
      ],
    },
    {
      key: 'options',
      label: '静态选项（未绑定数据集时使用，每行 label:value）',
      type: 'textarea',
      default: '北京:bj\n上海:sh\n广州:gz\n深圳:sz',
      group: '选项',
    },
    {
      key: 'cascade',
      label: '级联筛选（用其他筛选值缩小候选范围）',
      type: 'switch',
      default: false,
      group: '选项',
    },
    {
      key: 'cascadeKeys',
      label: '级联父字段（逗号分隔，留空=全部其他筛选器）',
      type: 'input',
      default: '',
      group: '选项',
    },
    {
      key: 'allowSelectAll',
      label: '多选支持全选/反选',
      type: 'switch',
      default: true,
      group: '选项',
    },
  ],
  dataBindingSchema: [
    {
      key: 'field',
      label: '筛选字段',
      type: 'category',
      multiple: false,
    },
  ],
  extraDefaults: {},
  supportsDataBinding: true,
}

export default filterDefinition

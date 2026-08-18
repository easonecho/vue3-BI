/**
 * 全局筛选器组件定义
 * 下拉选择器, 选中后广播值到其他图表组件
 */
import { defineAsyncComponent } from 'vue';
import type { ComponentDefinition } from '../types';

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
    { key: 'filterKey', label: '筛选字段', type: 'input', default: 'region', group: '基础' },
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
      key: 'options',
      label: '选项(每行一个 label:value)',
      type: 'textarea',
      default: '北京:bj\n上海:sh\n广州:gz\n深圳:sz',
      group: '选项',
    },
  ],
  extraDefaults: {},
  supportsDataBinding: false,
};

export default filterDefinition;

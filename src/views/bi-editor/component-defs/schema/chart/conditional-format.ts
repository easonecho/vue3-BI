import type { PropField } from '../props'

/**
 * 🔑 图表条件格式（预警色）：按数值阈值覆盖数据点颜色。
 *
 *   - 规则按顺序匹配，命中第一条即生效；
 *   - 系列为空作用于全部系列，填写后仅作用于同名系列；
 *   - 未选择颜色或阈值非法的规则不生效；
 *   - 折线图仅拐点变色（ECharts 数据点粒度限制）。
 */
export const chartConditionalFormatSchema: PropField[] = [
  {
    key: 'conditionalColorShow',
    label: '条件着色',
    type: 'switch',
    default: false,
    group: '条件格式',
    tip: '按数值阈值给数据点着色，用于预警 / 异常突出',
  },
  {
    key: 'conditionalColorRules',
    label: '着色规则',
    type: 'table',
    default: [],
    group: '条件格式',
    visibleWhen: { field: 'conditionalColorShow', truthy: true },
    tip: '规则从上到下优先；系列为空时作用于全部系列；未选颜色不生效',
    columns: [
      { key: 'seriesName', label: '系列', type: 'input', width: 84, placeholder: '全部' },
      {
        key: 'operator',
        label: '条件',
        type: 'select',
        width: 76,
        options: [
          { label: '大于', value: 'gt' },
          { label: '大于等于', value: 'gte' },
          { label: '小于', value: 'lt' },
          { label: '小于等于', value: 'lte' },
          { label: '等于', value: 'eq' },
          { label: '不等于', value: 'ne' },
          { label: '介于', value: 'between' },
          { label: '包含', value: 'contains' },
        ],
      },
      { key: 'value', label: '值', type: 'input', width: 62 },
      { key: 'value2', label: '值2', type: 'input', width: 62, placeholder: '介于' },
      { key: 'color', label: '颜色', type: 'colorpicker', width: 62 },
    ],
  },
]

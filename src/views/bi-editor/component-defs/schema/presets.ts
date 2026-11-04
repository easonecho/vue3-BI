import type { PropField, TableColumnSchema } from './props'
import { AGGREGATE_OPTIONS } from './options'

/** 🔑 有坐标轴图表（bar/line/scatter）seriesStyles 通用基础列：系列名称 + 颜色 + 显示标签 */
export const baseSeriesStylesWithAxesColumns: TableColumnSchema[] = [
  {
    key: 'seriesName',
    label: '系列名称',
    type: 'input',
    placeholder: 'series 的 name',
    width: 110,
  },
  { key: 'color', label: '颜色', type: 'colorpicker', width: 100 },
  { key: 'labelShow', label: '显示值标签', type: 'switch', width: 100 },
]

/** 🔑 无坐标轴图表（pie 等）seriesStyles 通用基础列：数据项 name + 颜色 + 显示标签 */
export const baseSeriesStylesNoAxesColumns: TableColumnSchema[] = [
  { key: 'name', label: '数据项名称', type: 'input', placeholder: 'data 的 name', width: 110 },
  { key: 'color', label: '颜色', type: 'colorpicker', width: 100 },
  { key: 'labelShow', label: '显示标签', type: 'switch', width: 100 },
]

/** 🔑 图表通用「聚合方式」属性字段 —— 启用后按类目字段在服务端 GROUP BY */
export const aggregatePropField: PropField = {
  key: 'aggregate',
  label: '聚合方式',
  type: 'select',
  options: [...AGGREGATE_OPTIONS],
  default: 'sum',
  group: '数据聚合',
  tip: '选择聚合方式后, GROUP BY 在数据源侧执行, 指标不受前端采样影响',
}

/** 🔑 聚合后 Top-N —— 0 表示不限；排序按第一个数值指标，在数据源侧 LIMIT */
export const topNPropFields: PropField[] = [
  {
    key: 'topN',
    label: 'Top N',
    type: 'number',
    default: 0,
    min: 0,
    max: 500,
    group: '数据聚合',
    tip: '仅保留聚合结果的前 N 项，0 表示全部（在数据源侧排序 + LIMIT）',
    visibleWhen: {
      field: 'aggregate',
      in: ['sum', 'avg', 'count', 'countDistinct', 'max', 'min'],
    },
  },
  {
    key: 'topNDirection',
    label: 'Top N 排序',
    type: 'select',
    options: [
      { label: '从大到小', value: 'desc' },
      { label: '从小到大', value: 'asc' },
    ],
    default: 'desc',
    group: '数据聚合',
    tip: '按第一个数值指标排序',
    visibleWhen: { field: 'topN', truthy: true },
  },
]

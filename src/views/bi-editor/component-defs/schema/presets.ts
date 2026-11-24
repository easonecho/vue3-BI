import type { PropField, TableColumnSchema } from './props'
import { AGGREGATE_OPTIONS } from './options'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 有坐标轴图表（bar/line/scatter）seriesStyles 通用基础列：系列名称 + 颜色 + 显示标签 */
export const baseSeriesStylesWithAxesColumns: TableColumnSchema[] = [
  {
    key: 'seriesName',
    get label() {
      return t('editorMaterial.ui.seriesName2')
    },
    type: 'input',
    get placeholder() {
      return t('editorMaterial.ui.seriesName')
    },
    width: 110,
  },
  {
    key: 'color',
    get label() {
      return t('editorMaterial.ui.color')
    },
    type: 'colorpicker',
    width: 100,
  },
  {
    key: 'labelShow',
    get label() {
      return t('editorMaterial.ui.showValueLabel')
    },
    type: 'switch',
    width: 100,
  },
]

/** 🔑 无坐标轴图表（pie 等）seriesStyles 通用基础列：数据项 name + 颜色 + 显示标签 */
export const baseSeriesStylesNoAxesColumns: TableColumnSchema[] = [
  {
    key: 'name',
    get label() {
      return t('editorMaterial.ui.itemName')
    },
    type: 'input',
    get placeholder() {
      return t('editorMaterial.ui.nameOfData')
    },
    width: 110,
  },
  {
    key: 'color',
    get label() {
      return t('editorMaterial.ui.color')
    },
    type: 'colorpicker',
    width: 100,
  },
  {
    key: 'labelShow',
    get label() {
      return t('editorMaterial.ui.showLabel')
    },
    type: 'switch',
    width: 100,
  },
]

/** 🔑 图表通用「聚合方式」属性字段 —— 启用后按类目字段在服务端 GROUP BY */
export const aggregatePropField: PropField = {
  key: 'aggregate',
  get label() {
    return t('editorMaterial.ui.aggregation')
  },
  type: 'select',
  options: [...AGGREGATE_OPTIONS],
  default: 'sum',
  get group() {
    return t('editorMaterial.ui.dataAggregation')
  },
  get tip() {
    return t(
      'editorMaterial.ui.whenAggregationIsEnabledGroupByRunsAtTheSourceSoMetricsAreUnaffectedByFrontEndSampling',
    )
  },
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
    get group() {
      return t('editorMaterial.ui.dataAggregation')
    },
    get tip() {
      return t('editorMaterial.ui.keepOnlyTheFirstNAggregatedRows0MeansAllSortLimitAtSource')
    },
    visibleWhen: {
      field: 'aggregate',
      in: ['sum', 'avg', 'count', 'countDistinct', 'max', 'min'],
    },
  },
  {
    key: 'topNDirection',
    get label() {
      return t('editorMaterial.ui.topNOrder')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.descending')
        },
        value: 'desc',
      },
      {
        get label() {
          return t('editorMaterial.ui.ascending')
        },
        value: 'asc',
      },
    ],
    default: 'desc',
    get group() {
      return t('editorMaterial.ui.dataAggregation')
    },
    get tip() {
      return t('editorMaterial.ui.sortByTheFirstNumericMetric')
    },
    visibleWhen: { field: 'topN', truthy: true },
  },
]

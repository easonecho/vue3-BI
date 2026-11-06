/**
 * 🔑 组件聚合规格固化
 *
 * 保存看板时把「图表实际使用的 GROUP BY + 度量」写进 layout.components[].aggregateSpec,
 * 定时报表据此在服务端执行同一套聚合, 避免快照退回原始行导致数字与看板不一致。
 *
 * 映射规则必须与各 Widget.vue 中 useChartAggregation / useMetricAggregation 的入参保持一致:
 *   - bar/area/line/combo: categoryField(或 drillFields 首层) + valueFields
 *   - pie/pie-rose:        nameField + valueField
 *   - treemap:             categoryField + valueField
 *   - rank-list:           categoryField + valueField (按值倒序)
 *   - sankey:              [sourceField, targetField] + valueField
 *   - kpi/stat/gauge:      valueField 单指标
 * 未启用聚合 / 未配置字段 / 未知组件返回 null, 报表仍按原始行取数。
 */
import type { AggregateFn } from '@/api/dataset'
import type { ComponentAggregateSpec, ComponentInstance } from '../types'

const AGGREGATE_FNS: readonly AggregateFn[] = [
  'sum',
  'avg',
  'count',
  'countDistinct',
  'max',
  'min',
]

/** Top-N 服务端硬上限 (与 useChartAggregation 保持一致) */
const TOP_N_MAX = 500

/** 未配置 Top-N 时各组件类型的默认行数上限 */
const CHART_DEFAULT_LIMIT = 2000
const RANK_LIST_LIMIT = 500

const METRIC_TYPES = new Set(['kpi-card', 'stat-card', 'gauge'])

type OrderBy = { field: string; direction: 'asc' | 'desc' }

interface FieldMapping {
  groupBy: string[]
  metrics: string[]
  orderBy?: OrderBy
  limit: number
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function clampTopN(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(TOP_N_MAX, Math.max(0, Math.floor(n)))
}

/** 读取聚合方式, 缺省按 schema 默认值 sum; 非法/不聚合返回 null */
function resolveAggregate(comp: ComponentInstance): AggregateFn | null {
  const aggregate = (str(comp.props?.aggregate) || 'sum') as AggregateFn
  return AGGREGATE_FNS.includes(aggregate) ? aggregate : null
}

/** 按组件类型映射分组/度量字段 (与 Widget.vue 保持一致) */
function resolveFields(comp: ComponentInstance): FieldMapping | null {
  const dc = comp.dataConfig ?? {}

  switch (comp.type) {
    case 'bar-chart':
    case 'area-chart':
    case 'line-chart': {
      const category = str(dc.categoryField)
      const metrics = strArray(dc.valueFields)
      return category && metrics.length > 0
        ? {
            groupBy: [category],
            metrics,
            orderBy: { field: category, direction: 'asc' },
            limit: CHART_DEFAULT_LIMIT,
          }
        : null
    }
    case 'combo-chart': {
      const category = str(dc.categoryField)
      const metrics = [str(dc.barField), str(dc.lineField)].filter(Boolean)
      return category && metrics.length > 0
        ? {
            groupBy: [category],
            metrics,
            orderBy: { field: category, direction: 'asc' },
            limit: CHART_DEFAULT_LIMIT,
          }
        : null
    }
    case 'pie-chart':
    case 'pie-rose-chart': {
      const name = str(dc.nameField)
      const value = str(dc.valueField)
      return name && value
        ? {
            groupBy: [name],
            metrics: [value],
            orderBy: { field: value, direction: 'desc' },
            limit: CHART_DEFAULT_LIMIT,
          }
        : null
    }
    case 'treemap-chart': {
      const category = str(dc.categoryField)
      const value = str(dc.valueField)
      return category && value
        ? {
            groupBy: [category],
            metrics: [value],
            limit: CHART_DEFAULT_LIMIT,
          }
        : null
    }
    case 'rank-list': {
      const category = str(dc.categoryField)
      const value = str(dc.valueField)
      return category && value
        ? {
            groupBy: [category],
            metrics: [value],
            orderBy: { field: value, direction: 'desc' },
            limit: RANK_LIST_LIMIT,
          }
        : null
    }
    case 'sankey-chart': {
      const source = str(dc.sourceField)
      const target = str(dc.targetField)
      const value = str(dc.valueField)
      return source && target && value
        ? {
            groupBy: [source, target],
            metrics: [value],
            limit: CHART_DEFAULT_LIMIT,
          }
        : null
    }
    default:
      return null
  }
}

/**
 * 生成组件的聚合规格快照。
 * @returns null 表示该组件不聚合 (报表按原始行取数)
 */
export function resolveComponentAggregateSpec(
  comp: ComponentInstance,
): ComponentAggregateSpec | null {
  const aggregate = resolveAggregate(comp)
  if (!aggregate) return null

  // 单指标组件: 无分组, 直接 AGG(field)
  if (METRIC_TYPES.has(comp.type)) {
    const field = str(comp.dataConfig?.valueField)
    if (!field && aggregate !== 'count') return null
    return {
      groupBy: [],
      metrics: [{ field: field || undefined, aggregate, alias: 'value' }],
      limit: 1,
    }
  }

  const mapping = resolveFields(comp)
  if (!mapping) return null

  // Top-N: 按第一个度量排序 + LIMIT (与 resolveTopNPolicy 一致)
  const topN = clampTopN(comp.props?.topN)
  const orderBy =
    topN > 0 && mapping.metrics.length > 0
      ? {
          field: mapping.metrics[0],
          direction: comp.props?.topNDirection === 'asc' ? ('asc' as const) : ('desc' as const),
        }
      : mapping.orderBy

  return {
    groupBy: mapping.groupBy,
    metrics: mapping.metrics.map((field) => ({ field, aggregate, alias: field })),
    orderBy,
    limit: topN > 0 ? topN : mapping.limit,
  }
}

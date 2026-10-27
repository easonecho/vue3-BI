/**
 * 图表聚合下推请求构建
 *
 * 把「全局筛选器 / 图表联动 / 钻取」三种前端过滤条件转换为服务端聚合查询的 filters,
 * 并生成 DatasetQueryParams。纯函数, 便于单测与复用。
 */
import type { AggregateFn, DatasetQueryParams, RowCondition } from '@/api/dataset'
import type { DrillFilter, FilterPrimitive, LinkFilter } from './linkage-filter'

const AGGREGATE_FNS: readonly AggregateFn[] = [
  'sum',
  'avg',
  'count',
  'countDistinct',
  'max',
  'min',
]

/** 图表聚合配置 (来自 props.aggregate + 字段映射) */
export interface ChartAggregateOptions {
  /** 'none' 表示不聚合 (保留原始行) */
  aggregate: string
  groupBy?: string
  metrics: { field: string; alias?: string }[]
  orderBy?: { field: string; direction?: 'asc' | 'desc' }
  limit?: number
}

/**
 * 将前端过滤条件转为聚合查询 filters (与 applyRowFilters 语义保持一致):
 * - 全局筛选器: 逗号分隔 → in; `_start`/`_end` → between/gte/lte
 * - 图表联动: 排除源组件自身
 * - 钻取: 已下钻层级的维度值等值过滤
 */
export function buildAggregateFilters(
  globalFilters: Record<string, FilterPrimitive>,
  linkFilters: LinkFilter[],
  drillFilters: DrillFilter[],
  componentId?: string,
): RowCondition[] {
  const filters: RowCondition[] = []
  const ranges = new Map<string, { start?: string; end?: string }>()

  for (const [key, value] of Object.entries(globalFilters ?? {})) {
    if (value === null || value === undefined || value === '') continue
    if (key.endsWith('_start') || key.endsWith('_end')) {
      const base = key.slice(0, key.lastIndexOf('_'))
      if (!base) continue
      const range = ranges.get(base) ?? {}
      if (key.endsWith('_start')) range.start = String(value)
      else range.end = String(value)
      ranges.set(base, range)
      continue
    }
    const str = String(value)
    if (str.includes(',')) {
      const list = str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      filters.push({ field: key, operator: 'in', value: list })
    } else {
      filters.push({ field: key, operator: 'eq', value })
    }
  }

  for (const [field, range] of ranges) {
    if (range.start && range.end) {
      filters.push({ field, operator: 'between', value: [range.start, range.end] })
    } else if (range.start) {
      filters.push({ field, operator: 'gte', value: range.start })
    } else if (range.end) {
      filters.push({ field, operator: 'lte', value: range.end })
    }
  }

  for (const filter of linkFilters ?? []) {
    if (filter.sourceId === componentId) continue
    filters.push({ field: filter.field, operator: 'eq', value: filter.value })
  }
  for (const filter of drillFilters ?? []) {
    filters.push({ field: filter.field, operator: 'eq', value: filter.value })
  }

  return filters
}

/**
 * 生成服务端聚合请求; 未启用聚合 / 缺少分组或度量时返回 null (回退到原始行)
 */
export function buildAggregateRequest(
  opts: ChartAggregateOptions,
  filters: RowCondition[],
): DatasetQueryParams | null {
  if (!AGGREGATE_FNS.includes(opts.aggregate as AggregateFn)) return null
  if (!opts.groupBy || opts.metrics.length === 0) return null

  return {
    groupBy: [opts.groupBy],
    metrics: opts.metrics.map((m) => ({
      field: m.field,
      aggregate: opts.aggregate as AggregateFn,
      alias: m.alias || m.field,
    })),
    filters,
    orderBy: opts.orderBy,
    limit: opts.limit ?? 2000,
  }
}

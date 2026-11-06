/**
 * 明细钻取（drill-through）过滤条件构建
 *
 * 与图表自身联动不同：图表查询会排除「当前组件作为源」的联动筛选（点击柱子不应改变自己），
 * 但明细需要包含所有联动筛选，否则点击柱子后无法看到对应值的原始行。
 *
 * 纯函数，便于单测与复用。
 */
import type { RowCondition } from '@/api/dataset'
import { buildAggregateFilters } from './aggregate-request'
import {
  resolveLinkField,
  type DrillFilter,
  type FilterPrimitive,
  type LinkFieldMap,
  type LinkFilter,
} from './linkage-filter'

export interface DetailFilterContext {
  globalFilters?: Record<string, FilterPrimitive>
  linkFilters?: LinkFilter[]
  drillFilters?: DrillFilter[]
  /** 联动字段映射：当前图表字段名与源图表不一致时使用 */
  linkFieldMap?: LinkFieldMap
  /** 额外精确匹配条件（图表点击项的维度值） */
  field?: string
  value?: string | number | null
}

const OPERATOR_LABELS: Record<string, string> = {
  eq: '=',
  ne: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: '包含',
  notIn: '不包含',
  like: '匹配',
  between: '区间',
  isNull: '为空',
  notNull: '不为空',
}

/** 去除重复条件，避免全局筛选与联动/钻取重复下发 */
function dedupeFilters(filters: RowCondition[]): RowCondition[] {
  const seen = new Set<string>()
  return filters.filter((filter) => {
    const key = `${filter.field}|${filter.operator}|${JSON.stringify(filter.value)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * 构建明细查询的 filters：
 *   - 全局筛选器（含日期区间/逗号多选）
 *   - 当前图表钻取栈
 *   - 所有图表联动筛选（含当前组件作为源的筛选）
 *   - 可选：点击项维度值精确匹配
 */
export function buildDetailFilters(ctx: DetailFilterContext): RowCondition[] {
  const filters = buildAggregateFilters(
    ctx.globalFilters ?? {},
    [],
    ctx.drillFilters ?? [],
    undefined,
    ctx.linkFieldMap,
  )

  for (const filter of ctx.linkFilters ?? []) {
    filters.push({
      field: resolveLinkField(filter, ctx.linkFieldMap),
      operator: 'eq',
      value: filter.value,
    })
  }

  if (ctx.field && ctx.value !== undefined && ctx.value !== null && ctx.value !== '') {
    filters.push({ field: ctx.field, operator: 'eq', value: ctx.value })
  }

  return dedupeFilters(filters)
}

/** 图表点击意图（ECharts 点击回调分流结果） */
export type ChartClickIntent =
  | { type: 'detail'; field: string; value: string }
  | { type: 'drill'; field: string; value: string }
  | { type: 'link'; field: string; value: string }
  | { type: 'none' }

export interface ChartClickIntentInput {
  /** 组件配置的点击行为: auto=联动/下钻, detail=打开明细 */
  clickAction?: string
  /** 当前生效维度字段 */
  field?: string
  /** ECharts 点击项名称 (维度值) */
  value?: unknown
  /** 组件配置的下钻字段 */
  drillFields?: string[]
  /** 已下钻层数 */
  drillDepth?: number
}

/**
 * 解析图表点击意图：
 *   - 无维度字段 / 空值 → none
 *   - 配置「打开明细」→ detail（优先于下钻/联动）
 *   - 配置了下钻字段且未到最后一层 → drill；已到最后一层 → none
 *   - 其余 → link
 */
export function resolveChartClickIntent(input: ChartClickIntentInput): ChartClickIntent {
  const field = input.field ?? ''
  const value = input.value
  if (!field || value === undefined || value === null || value === '') return { type: 'none' }

  if (input.clickAction === 'detail') {
    return { type: 'detail', field, value: String(value) }
  }

  const drillFields = input.drillFields ?? []
  if (drillFields.length > 0) {
    const depth = input.drillDepth ?? 0
    if (depth < drillFields.length) return { type: 'drill', field, value: String(value) }
    return { type: 'none' }
  }

  return { type: 'link', field, value: String(value) }
}

/** 把过滤条件转成可读标签，用于明细抽屉顶部提示 */
export function summarizeDetailFilters(filters: RowCondition[]): string[] {
  return filters.map(({ field, operator, value }) => {
    const label = OPERATOR_LABELS[operator] ?? operator
    if (operator === 'between' && Array.isArray(value) && value.length === 2) {
      return `${field} ${label} ${String(value[0])} ~ ${String(value[1])}`
    }
    if (Array.isArray(value)) {
      return `${field} ${label} (${value.map((item) => String(item)).join(', ')})`
    }
    if (value === undefined || value === null || value === '') return `${field} ${label}`
    return `${field} ${label} ${String(value)}`
  })
}

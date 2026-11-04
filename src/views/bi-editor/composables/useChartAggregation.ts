/**
 * 🔑 图表聚合下推请求 composable
 *
 * 从组件 props.aggregate 读取聚合方式, 由图表提供 groupBy/度量映射,
 * 全局筛选器/图表联动/钻取自动转换为服务端 filters。
 * 未启用聚合 (aggregate='none') 或未配置字段时返回 null → 图表回退到原始行。
 */
import { computed, type ComputedRef } from 'vue'
import { useLinkageStore } from '@/stores/linkage'
import { getDefinition } from '../component-defs'
import { deriveDefaultPropsCached } from '../component-defs/types'
import type { ComponentInstance } from '../types'
import type { DatasetQueryParams } from '@/api/dataset'
import { buildAggregateFilters, buildAggregateRequest } from './aggregate-request'

export interface ChartAggregationOptions {
  /** 分组维度 (钻取时由图表返回当前层级字段); 桑基图可返回 [source, target] */
  groupBy: () => string | string[] | undefined
  /** 度量字段列表, 别名与字段名一致 (图表映射按字段名取值) */
  metrics: () => string[]
  orderBy?: () => { field: string; direction?: 'asc' | 'desc' } | undefined
  limit?: number
}

/** Top-N 服务端硬上限, 避免一次请求过多分组 */
export const TOP_N_MAX = 500

/** 规范化 Top-N 配置: 非法/负数按 0 (不限) 处理 */
export function clampTopN(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(TOP_N_MAX, Math.max(0, Math.floor(n)))
}

/**
 * 计算聚合排序与行数限制:
 *   - 配置了 Top-N 且有度量字段 → 按第一个度量排序 + LIMIT N (覆盖图表默认排序)
 *   - 未配置 → 沿用图表默认 orderBy / limit
 */
export function resolveTopNPolicy(args: {
  topN: unknown
  topNDirection: unknown
  metrics: string[]
  fallbackOrderBy?: { field: string; direction?: 'asc' | 'desc' }
  fallbackLimit: number
}): { orderBy?: { field: string; direction?: 'asc' | 'desc' }; limit: number } {
  const topN = clampTopN(args.topN)
  if (topN > 0 && args.metrics.length > 0) {
    return {
      orderBy: {
        field: args.metrics[0],
        direction: args.topNDirection === 'asc' ? 'asc' : 'desc',
      },
      limit: topN,
    }
  }
  return { orderBy: args.fallbackOrderBy, limit: args.fallbackLimit }
}

export function useChartAggregation(
  comp: ComponentInstance,
  options: ChartAggregationOptions,
): ComputedRef<DatasetQueryParams | null> {
  const linkageStore = useLinkageStore()

  return computed<DatasetQueryParams | null>(() => {
    if (!comp.dataSource?.datasetId) return null

    const def = getDefinition(comp.type)
    const mergedProps = { ...deriveDefaultPropsCached(def), ...comp.props }
    const aggregate = String(mergedProps.aggregate ?? 'none')
    const groupBy = options.groupBy()
    const hasGroupBy = Array.isArray(groupBy) ? groupBy.length > 0 : !!groupBy
    if (!hasGroupBy) return null

    const filters = buildAggregateFilters(
      linkageStore.filterValues,
      linkageStore.linkFilters,
      comp.id ? linkageStore.getDrillStack(comp.id) : [],
      comp.id,
    )

    const metrics = options.metrics()
    const { orderBy, limit } = resolveTopNPolicy({
      topN: mergedProps.topN,
      topNDirection: mergedProps.topNDirection,
      metrics,
      fallbackOrderBy: options.orderBy?.(),
      fallbackLimit: options.limit ?? 2000,
    })

    return buildAggregateRequest(
      {
        aggregate,
        groupBy,
        metrics: metrics.map((field) => ({ field, alias: field })),
        orderBy,
        limit,
      },
      filters,
    )
  })
}

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

    return buildAggregateRequest(
      {
        aggregate,
        groupBy,
        metrics: options.metrics().map((field) => ({ field, alias: field })),
        orderBy: options.orderBy?.(),
        limit: options.limit ?? 2000,
      },
      filters,
    )
  })
}

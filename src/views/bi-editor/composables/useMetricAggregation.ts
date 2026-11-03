/**
 * 单指标全局聚合请求 (KPI / 统计卡 / 仪表盘)
 *
 * 与 useChartAggregation 的区别: 不需要分组维度, 直接在数据源侧执行
 * `SELECT AGG(field) WHERE ...`, 返回一行 { value }。
 * 未启用聚合 / 缺少度量字段时返回 null, 组件回退到原始行或静态值。
 */
import { computed, type ComputedRef } from 'vue'
import { useLinkageStore } from '@/stores/linkage'
import type { ComponentInstance } from '@/views/bi-editor/types'
import type { AggregateFn, DatasetQueryParams } from '@/api/dataset'
import { AGGREGATE_FNS, buildAggregateFilters } from './aggregate-request'

export interface MetricAggregationOptions {
  /** 度量字段 (count 可为空) */
  field: () => string | undefined
  /** 聚合方式 (由组件从 props.aggregate 读取, 默认 sum) */
  aggregate: () => string
  /** 结果别名, 默认 value */
  alias?: string
}

export function useMetricAggregation(
  comp: ComponentInstance,
  options: MetricAggregationOptions,
): ComputedRef<DatasetQueryParams | null> {
  const linkageStore = useLinkageStore()

  return computed<DatasetQueryParams | null>(() => {
    if (!comp.dataSource?.datasetId) return null

    const aggregate = String(options.aggregate() || 'sum')
    if (!AGGREGATE_FNS.includes(aggregate as AggregateFn)) return null
    if (aggregate === 'none') return null

    const field = options.field()
    if (!field && aggregate !== 'count') return null

    const filters = buildAggregateFilters(
      linkageStore.filterValues,
      linkageStore.linkFilters,
      comp.id ? linkageStore.getDrillStack(comp.id) : [],
      comp.id,
    )

    return {
      groupBy: [],
      metrics: [
        {
          field: field || undefined,
          aggregate: aggregate as AggregateFn,
          alias: options.alias || 'value',
        },
      ],
      filters,
      limit: 1,
    }
  })
}

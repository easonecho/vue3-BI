/**
 * 图表管理模块 API
 */
import { get, post, put, del } from '@/utils/request'
import type { Chart, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 创建图表参数 */
export interface CreateChartParams {
  name: string
  type: Chart['type']
  description?: string
  config: Record<string, unknown>
  datasetId: number
  dashboardId?: number
  position?: Record<string, unknown>
}

/** 获取图表列表 */
export function getChartList(params: PageQuery) {
  return get<PaginateData<Chart>>('/api/charts', params as Record<string, unknown>)
}

/** 获取图表类型列表 */
export function getChartTypes() {
  return get<Array<{ type: string; name: string }>>('/api/charts/types/list')
}

/** 获取图表详情 */
export function getChartDetail(id: number) {
  return get<Chart>(`/api/charts/${id}`)
}

/** 创建图表 */
export function createChart(data: CreateChartParams) {
  return post<Chart>('/api/charts', data)
}

/** 更新图表 */
export function updateChart(id: number, data: Partial<Chart>) {
  return put<Chart>(`/api/charts/${id}`, data)
}

/** 删除图表 */
export function deleteChart(id: number) {
  return del<null>(`/api/charts/${id}`)
}

/** 获取图表数据 (执行关联数据集) */
export function getChartData(id: number) {
  return post<{ list: Record<string, unknown>[] }>(`/api/charts/${id}/data`)
}
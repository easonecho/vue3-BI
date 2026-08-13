/**
 * 数据集管理模块 API
 */
import { get, post, put, del } from '@/utils/request'
import type { Dataset, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 创建数据集参数 */
export interface CreateDatasetParams {
  name: string
  description?: string
  datasourceId: number
  sql: string
  fields?: Record<string, unknown>
  cacheEnabled?: boolean
  cacheTtl?: number
}

/** 获取数据集列表 */
export function getDatasetList(params: PageQuery) {
  return get<PaginateData<Dataset>>('/api/datasets', params as Record<string, unknown>)
}

/** 获取数据集详情 */
export function getDatasetDetail(id: number) {
  return get<Dataset>(`/api/datasets/${id}`)
}

/** 创建数据集 */
export function createDataset(data: CreateDatasetParams) {
  return post<Dataset>('/api/datasets', data)
}

/** 更新数据集 */
export function updateDataset(id: number, data: Partial<Dataset>) {
  return put<Dataset>(`/api/datasets/${id}`, data)
}

/** 删除数据集 */
export function deleteDataset(id: number) {
  return del<null>(`/api/datasets/${id}`)
}

/** 预览数据集数据 */
export function previewDataset(id: number, params?: { limit?: number; offset?: number }) {
  return post<{ list: Record<string, unknown>[]; total: number }>(`/api/datasets/${id}/preview`, params)
}

/** 执行数据集 SQL */
export function executeDataset(id: number) {
  return post<{ list: Record<string, unknown>[] }>(`/api/datasets/${id}/execute`)
}
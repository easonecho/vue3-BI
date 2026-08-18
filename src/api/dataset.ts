/**
 * 数据集管理模块 API
 * P2 增强: 支持参数化查询 + 字段配置
 */
import { get, post, put, del } from '@/utils/request'
import type { Dataset, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 参数定义 (参数化查询) */
export interface DatasetParam {
  name: string
  label?: string
  type: 'string' | 'number' | 'date' | 'datetime' | 'boolean'
  defaultValue?: unknown
  required?: boolean
}

/** 字段配置 (别名/类型/计算字段) */
export interface DatasetField {
  name: string
  alias?: string
  type?: 'string' | 'number' | 'date' | 'datetime' | 'boolean'
  visible?: boolean
  computed?: boolean
  expression?: string
  format?: string
}

/** 创建数据集参数 */
export interface CreateDatasetParams {
  name: string
  description?: string
  datasourceId: number
  sql: string
  fields?: DatasetField[]
  params?: DatasetParam[]
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
export function updateDataset(id: number, data: Partial<CreateDatasetParams>) {
  return put<Dataset>(`/api/datasets/${id}`, data)
}

/** 删除数据集 */
export function deleteDataset(id: number) {
  return del<null>(`/api/datasets/${id}`)
}

/** 预览 SQL (临时, 无需已有数据集; 支持 params) */
export function previewSql(params: {
  datasourceId: number
  sql: string
  limit?: number
  params?: Record<string, unknown>
}) {
  return post<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  }>('/api/datasets/preview', params)
}

/** 执行数据集 SQL (支持 params) */
export function executeDataset(id: number, body?: { limit?: number; params?: Record<string, unknown> }) {
  return post<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  }>(`/api/datasets/${id}/execute`, body ?? {})
}

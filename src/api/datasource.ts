/**
 * 数据源管理模块 API
 */
import { get, post, put, del } from '@/utils/request'
import type { DataSource, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 创建数据源参数 */
export interface CreateDataSourceParams {
  name: string
  type: 'mysql' | 'postgresql'
  host: string
  port: number
  username: string
  password: string
  database: string
  description?: string
}

/** 获取数据源列表 */
export function getDataSourceList(params: PageQuery) {
  return get<PaginateData<DataSource>>('/api/datasources', params as Record<string, unknown>)
}

/** 获取数据源详情 */
export function getDataSourceDetail(id: number) {
  return get<DataSource>(`/api/datasources/${id}`)
}

/** 创建数据源 */
export function createDataSource(data: CreateDataSourceParams) {
  return post<DataSource>('/api/datasources', data)
}

/** 更新数据源 */
export function updateDataSource(id: number, data: Partial<DataSource>) {
  return put<DataSource>(`/api/datasources/${id}`, data)
}

/** 删除数据源 */
export function deleteDataSource(id: number) {
  return del<null>(`/api/datasources/${id}`)
}

/** 测试数据源连接 */
export function testDataSource(id: number) {
  return post<{ connected: boolean }>(`/api/datasources/${id}/test`)
}

/** 获取数据源的表列表 */
export function getDataSourceTables(id: number) {
  return get<string[]>(`/api/datasources/${id}/tables`)
}
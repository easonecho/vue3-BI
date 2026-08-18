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

/** 表字段结构 */
export interface TableField {
  name: string
  type: string
  nullable: boolean
  key: string
  defaultValue: string | null
  extra: string
  comment: string | null
}

/** Schema 表节点 (表 + 字段) */
export interface SchemaTableNode {
  name: string
  fields: TableField[]
}

/** Schema 树结构 */
export interface DataSourceSchema {
  database: string
  tableCount: number
  tables: SchemaTableNode[]
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
  return post<{ connected: boolean; tables: string[]; tableCount: number }>(`/api/datasources/${id}/test`)
}

/** 获取数据源的表列表 */
export function getDataSourceTables(id: number) {
  return get<string[]>(`/api/datasources/${id}/tables`)
}

/** 获取表的字段结构 */
export function getDataSourceTableFields(id: number, table: string) {
  return get<TableField[]>(`/api/datasources/${id}/tables/${encodeURIComponent(table)}/fields`)
}

/** 获取整个库的 Schema (表+字段树) */
export function getDataSourceSchema(id: number) {
  return get<DataSourceSchema>(`/api/datasources/${id}/schema`)
}

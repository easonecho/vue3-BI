/**
 * BI 低代码平台 - 接口数据类型定义
 */

/** 用户 */
export interface User {
  id: number
  username: string
  email?: string
  phone?: string
  nickname?: string
  avatar?: string
  status: number
  roleId: number
  createdAt: string
  updatedAt: string
}

/** 角色 */
export interface Role {
  id: number
  name: string
  code: string
  description?: string
  permissions?: string
}

/** 登录响应 */
export interface LoginResult {
  user: User
  token: string
}

/** 数据源 */
export interface DataSource {
  id: number
  name: string
  type: string
  host: string
  port: number
  username: string
  database: string
  status: number
  description?: string
}

/** 数据集 */
export interface Dataset {
  id: number
  name: string
  description?: string
  datasourceId: number
  sql: string
  fields?: Record<string, unknown>
  cacheEnabled?: boolean
  cacheTtl?: number
}

/** 仪表板 */
export interface Dashboard {
  id: number
  name: string
  description?: string
  layout?: Record<string, unknown>
  status: number
  isPublic: boolean
}

/** 图表 */
export interface Chart {
  id: number
  name: string
  type: 'bar' | 'line' | 'pie' | 'table' | 'gauge' | 'map' | 'scatter' | 'area'
  description?: string
  config: Record<string, unknown>
  datasetId: number
  dashboardId?: number
  position?: Record<string, unknown>
}

/** 分页查询参数 */
export interface PageQuery {
  page?: number
  pageSize?: number
  keyword?: string
  [key: string]: unknown
}
/**
 * BI 低代码平台 - 接口数据类型定义
 */

/** 用户 */
export interface User {
  id: number
  username: string
  email?: string | null
  phone?: string | null
  nickname?: string | null
  avatar?: string | null
  status: number
  roleId?: number
  departmentId?: number | null
  role?: { id: number; name: string; code: string } | null
  department?: { id: number; name: string } | null
  createdAt: string
  updatedAt: string
}

/** 角色 */
export interface Role {
  id: number
  name: string
  code: string
  description?: string
  permissions?: string[] | string | null
  dsType?: 'all' | 'oneself' | 'subordinate' | 'custom'
  _count?: { users?: number; userRoles?: number }
  createdAt?: string
  updatedAt?: string
}

/** 部门 */
export interface Department {
  id: number
  name: string
  code?: string
  parentId?: number | null
  sort?: number
  leaderId?: number | null
  status: number
  parent?: { id: number; name: string } | null
  leader?: { id: number; username: string; nickname?: string } | null
  children?: Department[]
  _count?: { children?: number; users?: number }
  createdAt?: string
  updatedAt?: string
}

/** 双 token 结构 */
export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessExpiresIn: number
}

/** 登录响应 */
export interface LoginResult extends TokenPair {
  user: User & { roleName?: string; permissions?: string | string[]; roleIds?: number[] }
  routers?: unknown[]
  perms?: string[]
}

/** 刷新 token 响应 */
export interface RefreshResult extends TokenPair {
  user: User & { roleName?: string; permissions?: string | string[]; roleIds?: number[] }
  routers?: unknown[]
  perms?: string[]
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

/** 仪表板分组 (P2-3) */
export interface DashboardGroup {
  id: number
  name: string
  description?: string | null
  sort: number
  creatorId: number
  creator?: { id: number; username: string; nickname?: string | null } | null
  _count?: { dashboards: number }
  createdAt: string
  updatedAt: string
}

/** 仪表板模板 (P2-3) */
export interface DashboardTemplate {
  id: number
  name: string
  description?: string | null
  layout?: Record<string, unknown> | null
  thumbnail?: string | null
  category?: string | null
  isPublic: boolean
  creatorId: number
  creator?: { id: number; username: string; nickname?: string | null } | null
  createdAt: string
  updatedAt: string
}

/** 仪表板 */
export interface Dashboard {
  id: number
  name: string
  description?: string
  layout?: Record<string, unknown>
  status: number
  isPublic: boolean
  groupId?: number | null                  // P2-3: 所属分组
  group?: { id: number; name: string } | null  // P2-3: 分组信息
  creatorId?: number
  creator?: { id: number; username: string; nickname?: string | null } | null
  _count?: { charts?: number }
  charts?: Array<{ id: number; name: string; type: string }>
  favorites?: Array<{ id: number }> | null  // 当前用户是否收藏 (有值=已收藏)
  createdAt?: string
  updatedAt?: string
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

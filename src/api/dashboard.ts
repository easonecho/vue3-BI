/**
 * 仪表板管理模块 API
 */
import { get, post, put, del } from '@/utils/request'
import type { Dashboard, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 创建仪表板参数 */
export interface CreateDashboardParams {
  name: string
  description?: string
  layout?: Record<string, unknown>
  thumbnail?: string
  isPublic?: boolean
  groupId?: number | null
}

/** 仪表板列表查询参数 (P2-3: 支持分组筛选) */
export interface DashboardListQuery extends PageQuery {
  status?: number
  isPublic?: boolean
  onlyFavorites?: boolean
  groupId?: number
  ungrouped?: boolean
}

/** 获取仪表板列表 */
export function getDashboardList(params: DashboardListQuery) {
  return get<PaginateData<Dashboard>>('/api/dashboards', params as Record<string, unknown>)
}

/** 获取仪表板详情 */
export function getDashboardDetail(id: number) {
  return get<Dashboard>(`/api/dashboards/${id}`)
}

/** 创建仪表板 */
export function createDashboard(data: CreateDashboardParams) {
  return post<Dashboard>('/api/dashboards', data)
}

/** 更新仪表板 */
export function updateDashboard(id: number, data: Partial<Dashboard>) {
  return put<Dashboard>(`/api/dashboards/${id}`, data)
}

/** 删除仪表板 */
export function deleteDashboard(id: number) {
  return del<null>(`/api/dashboards/${id}`)
}

/** 复制仪表板 (4.1 新增) */
export function copyDashboard(id: number) {
  return post<Dashboard>(`/api/dashboards/${id}/copy`)
}

/** 切换收藏状态 (4.4 新增) */
export function toggleFavorite(id: number) {
  return post<{ isFavorited: boolean }>(`/api/dashboards/${id}/favorite`)
}

/** 移动仪表板到分组 (P2-3: groupId=null 表示移出分组) */
export function moveDashboardToGroup(id: number, groupId: number | null) {
  return put<Dashboard>(`/api/dashboards/${id}`, { groupId })
}

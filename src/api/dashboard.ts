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
  isPublic?: boolean
}

/** 获取仪表板列表 */
export function getDashboardList(params: PageQuery) {
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
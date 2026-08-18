/**
 * 仪表板分组 API (P2-3)
 */
import { get, post, put, del } from '@/utils/request'

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

export interface CreateDashboardGroupParams {
  name: string
  description?: string
  sort?: number
}

export type UpdateDashboardGroupParams = Partial<CreateDashboardGroupParams>

/** 获取分组列表 */
export function getDashboardGroupList() {
  return get<DashboardGroup[]>('/api/dashboard-groups')
}

/** 创建分组 */
export function createDashboardGroup(data: CreateDashboardGroupParams) {
  return post<DashboardGroup>('/api/dashboard-groups', data)
}

/** 更新分组 */
export function updateDashboardGroup(id: number, data: UpdateDashboardGroupParams) {
  return put<DashboardGroup>(`/api/dashboard-groups/${id}`, data)
}

/** 删除分组 */
export function deleteDashboardGroup(id: number) {
  return del<null>(`/api/dashboard-groups/${id}`)
}

/**
 * 仪表板模板 API (P2-3)
 */
import { get, post, put, del } from '@/utils/request'
import type { Dashboard } from './types'

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

export interface CreateDashboardTemplateParams {
  name: string
  description?: string
  layout?: Record<string, unknown>
  thumbnail?: string
  category?: string
  isPublic?: boolean
}

export interface SaveAsTemplateParams {
  name: string
  description?: string
  thumbnail?: string
  category?: string
  isPublic?: boolean
}

export interface ApplyTemplateParams {
  name: string
  description?: string
  isPublic?: boolean
}

/** 获取模板列表 */
export function getDashboardTemplateList(category?: string) {
  return get<DashboardTemplate[]>('/api/dashboard-templates', category ? { category } : undefined)
}

/** 获取模板详情 */
export function getDashboardTemplateDetail(id: number) {
  return get<DashboardTemplate>(`/api/dashboard-templates/${id}`)
}

/** 创建模板 */
export function createDashboardTemplate(data: CreateDashboardTemplateParams) {
  return post<DashboardTemplate>('/api/dashboard-templates', data)
}

/** 更新模板 */
export function updateDashboardTemplate(id: number, data: Partial<CreateDashboardTemplateParams>) {
  return put<DashboardTemplate>(`/api/dashboard-templates/${id}`, data)
}

/** 删除模板 */
export function deleteDashboardTemplate(id: number) {
  return del<null>(`/api/dashboard-templates/${id}`)
}

/** 从已有仪表板保存为模板 */
export function saveAsTemplate(dashboardId: number, data: SaveAsTemplateParams) {
  return post<DashboardTemplate>(`/api/dashboard-templates/save-from-dashboard/${dashboardId}`, data)
}

/** 基于模板创建仪表板 */
export function applyTemplate(templateId: number, data: ApplyTemplateParams) {
  return post<Dashboard>(`/api/dashboard-templates/${templateId}/apply`, data)
}

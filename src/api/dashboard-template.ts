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
  /** 是否系统预置模板 (true=预置, false=用户创建) */
  isSystem: boolean
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
  isSystem?: boolean
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

/** 模板列表查询参数 */
export interface DashboardTemplateListQuery {
  category?: string
  /** true=仅预置模板, false=仅用户模板, undefined=全部 */
  isSystem?: boolean
}

/** 模板分类枚举选项 (服务端统一管理, 前端不可自由输入) */
export interface TemplateCategoryOption {
  value: string
  label: string
  i18nKey: string
}

/** 获取模板分类枚举 (服务端统一管理) */
export function getTemplateCategories() {
  return get<TemplateCategoryOption[]>('/api/dashboard-templates/categories')
}
/** 获取模板列表 */
export function getDashboardTemplateList(query?: DashboardTemplateListQuery) {
  const params: Record<string, unknown> = {}
  if (query?.category) params.category = query.category
  if (query?.isSystem !== undefined) params.isSystem = String(query.isSystem)
  return get<DashboardTemplate[]>('/api/dashboard-templates', Object.keys(params).length ? params : undefined)
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

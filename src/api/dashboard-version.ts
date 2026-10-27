/**
 * 看板版本管理 API
 */
import { get, post, del } from '@/utils/request'
import type { PaginateData } from '@/utils/request'
import type { Dashboard } from './types'

/** 版本快照结构 (与后端 DashboardVersionSnapshot 对应) */
export interface DashboardVersionSnapshot {
  name: string
  description: string | null
  /** 看板画布配置 (编辑器持久化结构) */
  layout: {
    version?: string
    components?: unknown[]
    canvas?: unknown
    guides?: unknown[]
  } | null
  thumbnail: string | null
  status: number
  isPublic: boolean
  groupId: number | null
  chartCount: number
  capturedAt: string
}

/** 版本列表项 (不含快照大字段) */
export interface DashboardVersion {
  id: number
  dashboardId: number
  versionNo: number
  name: string
  remark: string | null
  creatorId: number
  createdAt: string
  creator?: { id: number; username: string; nickname: string | null }
  /** 仅详情接口返回 */
  snapshot?: DashboardVersionSnapshot
}

export interface DashboardVersionQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

/** 版本列表 (分页) */
export function getDashboardVersions(dashboardId: number, params: DashboardVersionQuery) {
  return get<PaginateData<DashboardVersion>>(
    `/api/dashboards/${dashboardId}/versions`,
    params as Record<string, unknown>,
  )
}

/** 版本详情 (含完整快照) */
export function getDashboardVersion(dashboardId: number, versionId: number) {
  return get<DashboardVersion>(`/api/dashboards/${dashboardId}/versions/${versionId}`)
}

/** 保存当前看板配置为新版本 */
export function createDashboardVersion(dashboardId: number, remark?: string) {
  return post<DashboardVersion>(`/api/dashboards/${dashboardId}/versions`, {
    remark: remark || null,
  })
}

/** 恢复历史版本 (后端会先自动备份当前配置) */
export function restoreDashboardVersion(dashboardId: number, versionId: number) {
  return post<{ backupVersionNo: number; dashboard: Dashboard }>(
    `/api/dashboards/${dashboardId}/versions/${versionId}/restore`,
  )
}

/** 删除版本 (逻辑删除) */
export function deleteDashboardVersion(dashboardId: number, versionId: number) {
  return del<null>(`/api/dashboards/${dashboardId}/versions/${versionId}`)
}

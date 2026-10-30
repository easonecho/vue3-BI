/**
 * 看板分享模块 API
 */
import { get, post, del } from '@/utils/request'
import type { DatasetQueryParams, DatasetQueryResult } from './dataset'

/** 分享配置 (已登录用户查询) */
export interface ShareConfig {
  shareToken: string | null
  shareUrl: string | null
  hasPassword: boolean
  expiresAt: string | null
  isShared: boolean
}

/** 创建分享参数 */
export interface CreateShareParams {
  password?: string
  expiresInHours?: number
}

/** 公开看板数据 */
export interface PublicDashboard {
  id: number
  name: string
  description?: string
  layout?: Record<string, unknown>
  isPasswordProtected: boolean
  charts: Array<{
    id: number
    name: string
    type: string
    config: Record<string, unknown>
    position?: Record<string, unknown>
    datasetId: number
  }>
}

/** 公开访问可能返回的类型 (无密码: 看板数据; 有密码: passwordRequired 标志) */
export type PublicDashboardResult = PublicDashboard | { passwordRequired: boolean }

/** 判断是否需要密码 */
export function isPasswordRequired(data: PublicDashboardResult): data is { passwordRequired: boolean } {
  // 🔑 响应来自网络，按 unknown 读取后再收窄，不直接断言整体形状
  if (typeof data !== 'object' || data === null || !('passwordRequired' in data)) return false
  return (data as { passwordRequired?: unknown }).passwordRequired === true
}

// ========== 已登录: 分享配置管理 ==========

export function getShareConfig(dashboardId: number) {
  return get<ShareConfig>(`/api/dashboards/${dashboardId}/share`)
}

export function createShare(dashboardId: number, params: CreateShareParams) {
  return post<ShareConfig>(`/api/dashboards/${dashboardId}/share`, params)
}

export function revokeShare(dashboardId: number) {
  return del<null>(`/api/dashboards/${dashboardId}/share`)
}

// ========== 公开访问 (无需登录) ==========

/** 公开访问看板 (GET: 无密码直接返回, 有密码返回 passwordRequired) */
export function getPublicDashboard(token: string) {
  return get<PublicDashboardResult>(`/api/public/dashboards/${token}`)
}

/** 公开访问看板 (POST: 带密码验证) */
export function verifyPublicDashboard(token: string, password: string) {
  return post<PublicDashboard>(`/api/public/dashboards/${token}`, { password })
}

/** 公开数据集取数 (分享页/嵌入页图表渲染, 无需登录) */
export function executePublicDataset(
  token: string,
  datasetId: number,
  body?: { password?: string; limit?: number },
) {
  return post<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  }>(`/api/public/dashboards/${token}/datasets/${datasetId}/execute`, body ?? {})
}

/** 公开数据集聚合查询 (分享页/嵌入页, 无需登录) */
export function queryPublicDataset(
  token: string,
  datasetId: number,
  body: DatasetQueryParams & { password?: string },
) {
  return post<DatasetQueryResult>(
    `/api/public/dashboards/${token}/datasets/${datasetId}/query`,
    body,
  )
}

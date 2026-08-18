/**
 * 看板分享模块 API
 */
import { get, post, del } from '@/utils/request'

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
  return (data as any)?.passwordRequired === true
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

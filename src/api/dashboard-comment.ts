/**
 * 看板协作评论 API
 */
import { get, post, put, del } from '@/utils/request'
import type { PaginateData } from '@/utils/request'

/** 评论作者 */
export interface DashboardCommentCreator {
  id: number
  username: string
  nickname?: string | null
  avatar?: string | null
}

/** 看板评论 (componentId=null 表示针对整个看板) */
export interface DashboardComment {
  id: number
  dashboardId: number
  componentId: string | null
  content: string
  resolved: boolean
  creatorId: number
  creator?: DashboardCommentCreator | null
  createdAt: string
  updatedAt: string
}

/** 评论列表查询参数 */
export interface DashboardCommentQuery {
  page?: number
  pageSize?: number
  /** 组件 ID; 传空串仅看板整体评论, 不传导全部 */
  componentId?: string
  resolved?: boolean
}

/** 评论列表 (分页) */
export function getDashboardComments(dashboardId: number, params?: DashboardCommentQuery) {
  return get<PaginateData<DashboardComment>>(
    `/api/dashboards/${dashboardId}/comments`,
    (params || {}) as Record<string, unknown>,
  )
}

/** 发表评论 */
export function createDashboardComment(
  dashboardId: number,
  data: { content: string; componentId?: string | null },
) {
  return post<DashboardComment>(`/api/dashboards/${dashboardId}/comments`, data)
}

/** 编辑评论内容 / 标记已解决 */
export function updateDashboardComment(
  dashboardId: number,
  commentId: number,
  data: { content?: string; resolved?: boolean },
) {
  return put<DashboardComment>(`/api/dashboards/${dashboardId}/comments/${commentId}`, data)
}

/** 删除评论 (逻辑删除) */
export function deleteDashboardComment(dashboardId: number, commentId: number) {
  return del<null>(`/api/dashboards/${dashboardId}/comments/${commentId}`)
}

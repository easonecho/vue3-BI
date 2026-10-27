/**
 * 使用分析 API
 */
import { get } from '@/utils/request'

export interface UsageOverview {
  range: { days: number; since: string; until: string }
  summary: {
    totalViews: number
    todayViews: number
    activeUsers: number
    coveredDashboards: number
  }
  trend: Array<{ date: string; count: number }>
  topDashboards: Array<{ dashboardId: number | null; dashboardName: string; views: number }>
  topUsers: Array<{ userId: number | null; username: string; views: number }>
  recent: Array<{ dashboardName: string; username: string; source: string; createdAt: string }>
}

/** 获取使用分析概览 (近 N 天) */
export function getUsageOverview(days: number) {
  return get<UsageOverview>('/api/usage/overview', { days })
}

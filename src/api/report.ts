/**
 * 定时报表订阅 API
 */
import { get, post, put, del } from '@/utils/request'
import type { PaginateData } from '@/utils/request'

export type ReportChannel = 'inbox' | 'webhook'
export type ReportRunStatus = 'success' | 'failed'

export interface ReportSubscription {
  id: number
  name: string
  dashboardId: number
  cron: string
  recipients: string | null
  channel: ReportChannel
  webhookUrl: string | null
  enabled: boolean
  lastRunAt: string | null
  lastStatus: ReportRunStatus | null
  lastMessage: string | null
  createdAt: string
  dashboard?: { id: number; name: string }
  creator?: { id: number; username: string; nickname: string | null }
  _count?: { deliveries: number }
}

export interface ReportSubscriptionInput {
  name: string
  dashboardId: number
  cron: string
  recipients?: string | null
  channel: ReportChannel
  webhookUrl?: string | null
  enabled?: boolean
}

export interface ReportChartSnapshot {
  id: number
  name: string
  type: string
  datasetId: number
  datasetName: string | null
  columns: string[]
  rows: Record<string, unknown>[]
  truncated: boolean
  error?: string
}

export interface ReportSnapshot {
  dashboard: {
    id: number
    name: string
    description: string | null
    chartCount: number
  }
  charts: ReportChartSnapshot[]
  generatedAt: string
}

export interface ReportDelivery {
  id: number
  subscriptionId: number
  dashboardId: number
  dashboardName: string
  title: string
  content: ReportSnapshot | { error?: string }
  recipients: string
  channel: ReportChannel
  status: ReportRunStatus
  message: string | null
  readFlag: number
  createdAt: string
  subscription?: { id: number; name: string }
}

export function getReportSubscriptions(dashboardId: number) {
  return get<ReportSubscription[]>('/api/report-subscriptions', { dashboardId })
}

export function createReportSubscription(data: ReportSubscriptionInput) {
  return post<ReportSubscription>('/api/report-subscriptions', data)
}

export function updateReportSubscription(id: number, data: Partial<ReportSubscriptionInput>) {
  return put<ReportSubscription>(`/api/report-subscriptions/${id}`, data)
}

export function deleteReportSubscription(id: number) {
  return del<null>(`/api/report-subscriptions/${id}`)
}

export function runReportSubscription(id: number) {
  return post<ReportDelivery>(`/api/report-subscriptions/${id}/run`)
}

export function getReportDeliveries(params: {
  subscriptionId?: number
  dashboardId?: number
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}) {
  return get<PaginateData<ReportDelivery>>('/api/report-deliveries', params)
}

export function getReportDelivery(id: number) {
  return get<ReportDelivery>(`/api/report-deliveries/${id}`)
}

export function markReportDeliveryRead(id: number) {
  return put<ReportDelivery>(`/api/report-deliveries/${id}/read`)
}

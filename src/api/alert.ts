/**
 * 告警订阅 API (P1)
 */
import { get, post, put, del } from '@/utils/request'
import type { PaginateData } from '@/utils/request'

export type AlertAggregate = 'count' | 'sum' | 'avg' | 'max' | 'min'
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne'

export interface AlertRule {
  id: number
  name: string
  datasetId: number
  field: string | null
  aggregate: AlertAggregate
  operator: AlertOperator
  threshold: number
  cron: string
  enabled: boolean
  webhookUrl: string | null
  lastRunAt: string | null
  lastValue: number | null
  createdAt: string
  _count?: { events: number }
}

export interface AlertRuleInput {
  name: string
  datasetId: number
  field?: string | null
  aggregate: AlertAggregate
  operator: AlertOperator
  threshold: number
  cron: string
  enabled?: boolean
  webhookUrl?: string | null
}

export interface AlertEvent {
  id: number
  ruleId: number
  ruleName: string
  datasetId: number
  value: number
  threshold: number
  message: string
  status: number
  createdAt: string
}

export interface AlertRunResult {
  value: number
  triggered: boolean
  eventId: number | null
}

export function getAlertRules(datasetId: number) {
  return get<AlertRule[]>('/api/alert-rules', { datasetId })
}

export function createAlertRule(data: AlertRuleInput) {
  return post<AlertRule>('/api/alert-rules', data)
}

export function updateAlertRule(id: number, data: Partial<AlertRuleInput>) {
  return put<AlertRule>(`/api/alert-rules/${id}`, data)
}

export function deleteAlertRule(id: number) {
  return del<null>(`/api/alert-rules/${id}`)
}

export function runAlertRule(id: number) {
  return post<AlertRunResult>(`/api/alert-rules/${id}/run`)
}

export function getAlertEvents(params: {
  datasetId?: number
  ruleId?: number
  status?: number
  page?: number
  pageSize?: number
}) {
  return get<PaginateData<AlertEvent>>('/api/alert-events', params)
}

export function markAlertEventRead(id: number) {
  return put<AlertEvent>(`/api/alert-events/${id}/read`)
}

export function markAllAlertEventsRead(datasetId?: number) {
  return post<{ count: number }>('/api/alert-events/read-all', { datasetId })
}

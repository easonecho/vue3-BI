/**
 * 数据血缘 API (P2-3)
 */
import { get } from '@/utils/request'

export type LineageNodeKind = 'datasource' | 'dataset' | 'dashboard'

export interface LineageNode {
  id: string
  kind: LineageNodeKind
  name: string
  meta?: string
}

export interface LineageEdge {
  source: string
  target: string
  label?: string
}

export interface LineageStats {
  datasourceCount: number
  datasetCount: number
  dashboardCount: number
  edgeCount: number
}

export interface LineageData {
  nodes: LineageNode[]
  edges: LineageEdge[]
  stats: LineageStats
}

export interface LineageQuery {
  keyword?: string
  /** 聚焦到某个数据集: 仅返回其数据源、自身与下游看板 */
  datasetId?: number
  /** 聚焦到某个看板: 仅返回其上游数据集与数据源 */
  dashboardId?: number
}

/** 获取数据血缘图 (数据源→数据集→看板; 支持按数据集/看板聚焦) */
export function getLineage(params: LineageQuery = {}) {
  const query: Record<string, string | number> = {}
  const keyword = params.keyword?.trim()
  if (keyword) query.keyword = keyword
  if (params.datasetId) query.datasetId = params.datasetId
  if (params.dashboardId) query.dashboardId = params.dashboardId
  return get<LineageData>('/api/lineage', Object.keys(query).length ? query : undefined)
}

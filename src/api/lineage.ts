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

/** 获取数据血缘图 (数据源→数据集→看板) */
export function getLineage(keyword?: string) {
  return get<LineageData>('/api/lineage', keyword ? { keyword } : undefined)
}

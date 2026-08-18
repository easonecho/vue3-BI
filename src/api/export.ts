/**
 * 数据导出模块 API
 */
import { download } from '@/utils/request'

/** 导出参数 */
export interface ExportParams {
  limit?: number
  filename?: string
}

/** 导出数据集为 CSV */
export function exportDatasetCsv(id: number, params?: ExportParams) {
  return download(`/api/export/dataset/${id}/csv`, params)
}

/** 导出数据集为 JSON */
export function exportDatasetJson(id: number, params?: ExportParams) {
  return download(`/api/export/dataset/${id}/json`, params)
}

/** 导出图表数据为 CSV */
export function exportChartCsv(id: number, params?: ExportParams) {
  return download(`/api/export/chart/${id}/csv`, params)
}

/** 导出图表数据为 JSON */
export function exportChartJson(id: number, params?: ExportParams) {
  return download(`/api/export/chart/${id}/json`, params)
}

/** 触发浏览器下载 */
export function saveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

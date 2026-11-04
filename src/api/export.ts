/**
 * 数据导出模块 API
 */
import { downloadWithMeta } from '@/utils/request'

/** 导出参数 */
export interface ExportParams {
  limit?: number
  filename?: string
}

/** 导出数据集为 CSV */
export function exportDatasetCsv(id: number, params?: ExportParams) {
  return downloadWithMeta(`/api/export/dataset/${id}/csv`, params)
}

/** 导出数据集为 Excel */
export function exportDatasetXlsx(id: number, params?: ExportParams) {
  return downloadWithMeta(`/api/export/dataset/${id}/xlsx`, params)
}

/** 导出数据集为 JSON */
export function exportDatasetJson(id: number, params?: ExportParams) {
  return downloadWithMeta(`/api/export/dataset/${id}/json`, params)
}

/** 导出图表数据为 CSV */
export function exportChartCsv(id: number, params?: ExportParams) {
  return downloadWithMeta(`/api/export/chart/${id}/csv`, params)
}

/** 导出图表数据为 Excel */
export function exportChartXlsx(id: number, params?: ExportParams) {
  return downloadWithMeta(`/api/export/chart/${id}/xlsx`, params)
}

/** 导出图表数据为 JSON */
export function exportChartJson(id: number, params?: ExportParams) {
  return downloadWithMeta(`/api/export/chart/${id}/json`, params)
}

export type ExportFormat = 'csv' | 'json' | 'xlsx'

/** 按格式导出数据集 */
export function exportDatasetByFormat(id: number, format: ExportFormat, params?: ExportParams) {
  if (format === 'xlsx') return exportDatasetXlsx(id, params)
  if (format === 'json') return exportDatasetJson(id, params)
  return exportDatasetCsv(id, params)
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

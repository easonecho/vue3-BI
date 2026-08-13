/**
 * 数据导出模块 API
 */
import { download, get } from '@/utils/request'

/** 导出数据集为 CSV */
export function exportDatasetCsv(id: number) {
  return download(`/api/export/dataset/${id}/csv`)
}

/** 导出数据集为 JSON */
export function exportDatasetJson(id: number) {
  return download(`/api/export/dataset/${id}/json`)
}

/** 导出图表数据 */
export function exportChartData(id: number) {
  return get<Blob>(`/api/export/chart/${id}/data`, undefined, { responseType: 'blob' }).then((res) => res.data as unknown as Blob)
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
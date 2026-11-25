/**
 * 看板版本管理 - 纯展示工具
 */
import type { DashboardVersion } from '@/api/dashboard-version'
import { formatDateTime } from '@/utils/locale-format'

/** 版本时间格式化（无效时间回退 '-'） */
export function formatVersionTime(value?: string | null): string {
  if (!value) return '-'
  return formatDateTime(value)
}

/** 版本快照中的画布组件数量 */
export function countComponents(detail: DashboardVersion | null): number {
  return detail?.snapshot?.layout?.components?.length ?? 0
}

/** 版本快照中的画布尺寸（缺失时回退 '-'） */
export function formatCanvasSize(detail: DashboardVersion | null): string {
  const canvas = detail?.snapshot?.layout?.canvas as
    { width?: number; height?: number } | null | undefined
  if (!canvas?.width || !canvas?.height) return '-'
  return `${canvas.width} × ${canvas.height}`
}

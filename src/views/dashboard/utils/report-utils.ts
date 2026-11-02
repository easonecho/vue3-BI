/** 定时报表相关的纯展示函数，便于单测与跨组件复用 */

/** 时间格式化：空值显示 -，使用 zh-CN 24 小时制 */
export function formatTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

/** 快照单元格展示：null/undefined → -，对象 → JSON 字符串 */
export function cellValue(row: Record<string, unknown>, col: string): string {
  const value = row[col]
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

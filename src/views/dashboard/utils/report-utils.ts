/** 定时报表相关的纯展示函数，便于单测与跨组件复用 */

const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/

/** 时间格式化：空值显示 -，使用 zh-CN 24 小时制 */
export function formatTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

/**
 * 解析逗号/分号/空白分隔的收件邮箱。
 * 与后端 report-delivery 的解析规则保持一致：去重、识别非法项。
 */
export function parseRecipientEmails(raw: string | null | undefined): {
  valid: string[]
  invalid: string[]
} {
  const parts = String(raw ?? '')
    .split(/[,;，；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  const valid: string[] = []
  const invalid: string[] = []
  const seen = new Set<string>()
  for (const part of parts) {
    // 邮箱中不允许出现 CR/LF, 避免邮件头注入
    const normalized = part.replace(/[\r\n]/g, '')
    if (!EMAIL_PATTERN.test(normalized)) {
      invalid.push(part)
      continue
    }
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    valid.push(normalized)
  }
  return { valid, invalid }
}

/** 快照单元格展示：null/undefined → -，对象 → JSON 字符串 */
export function cellValue(row: Record<string, unknown>, col: string): string {
  const value = row[col]
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * 按当前应用语言格式化日期时间
 *
 * 原先多处硬编码 toLocaleString('zh-CN')，切换到英文后仍显示中文日期格式。
 */
import i18n from '@/i18n'

/** 日期时间格式化（24 小时制）；非法日期返回 '-' */
export function formatDateTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(i18n.global.locale.value, { hour12: false })
}

/** 数字格式化（千分位/小数位），跟随当前应用语言 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(i18n.global.locale.value, options)
}

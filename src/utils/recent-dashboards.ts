/**
 * 最近访问看板（本地存储）
 *
 * 预览看板时记录，看板列表页读取展示，仅保存在浏览器本地，不涉及服务端。
 */
import i18n from '@/i18n'

export interface RecentDashboard {
  id: number
  name: string
  /** 最近访问时间（毫秒时间戳） */
  visitedAt: number
}

export const RECENT_DASHBOARDS_KEY = 'bi-recent-dashboards'
export const RECENT_DASHBOARDS_LIMIT = 8

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    // 隐私模式等场景访问 localStorage 会抛错
    return null
  }
}

function isRecentDashboard(value: unknown): value is RecentDashboard {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'number' &&
    Number.isFinite(item.id) &&
    typeof item.name === 'string' &&
    item.name.trim() !== '' &&
    typeof item.visitedAt === 'number' &&
    Number.isFinite(item.visitedAt)
  )
}

/** 读取最近访问列表：按时间倒序、过滤脏数据、最多 8 条 */
export function readRecentDashboards(): RecentDashboard[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(RECENT_DASHBOARDS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(isRecentDashboard)
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, RECENT_DASHBOARDS_LIMIT)
  } catch {
    return []
  }
}

function writeRecent(list: RecentDashboard[]): RecentDashboard[] {
  const storage = getStorage()
  try {
    storage?.setItem(RECENT_DASHBOARDS_KEY, JSON.stringify(list))
  } catch {
    // 存储配额不足时忽略，保证访问流程不被中断
  }
  return list
}

/** 删除看板后同步移除最近访问记录 */
export function removeRecentDashboard(id: number): RecentDashboard[] {
  return writeRecent(readRecentDashboards().filter((item) => item.id !== id))
}

/** 重命名看板后同步最近访问名称，空名称忽略 */
export function renameRecentDashboard(id: number, name: string): RecentDashboard[] {
  const nextName = name.trim()
  if (!nextName) return readRecentDashboards()
  return writeRecent(
    readRecentDashboards().map((item) => (item.id === id ? { ...item, name: nextName } : item)),
  )
}

/** 记录一次访问：去重后置顶，返回最新列表 */
export function recordRecentDashboard(
  item: { id: number; name: string },
  now = Date.now(),
): RecentDashboard[] {
  const name = item.name.trim()
  if (!Number.isFinite(item.id) || !name) return readRecentDashboards()

  const rest = readRecentDashboards().filter((recent) => recent.id !== item.id)
  const next = [{ id: item.id, name, visitedAt: now }, ...rest].slice(0, RECENT_DASHBOARDS_LIMIT)
  return writeRecent(next)
}

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 / 日期 */
export function formatRecentTime(visitedAt: number, now = Date.now()): string {
  const diff = Math.max(0, now - visitedAt)
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000

  if (diff < minute) return i18n.global.t('appMessages.recent.justNow')
  if (diff < hour)
    return i18n.global.t('appMessages.recent.minutesAgo', { n: Math.floor(diff / minute) })
  if (diff < day)
    return i18n.global.t('appMessages.recent.hoursAgo', { n: Math.floor(diff / hour) })
  if (diff < 7 * day)
    return i18n.global.t('appMessages.recent.daysAgo', { n: Math.floor(diff / day) })

  const date = new Date(visitedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

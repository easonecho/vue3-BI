import type { MaterialType } from '@/api/material'

/** el-tag 可用的样式类型（素材分类映射） */
export type MaterialTagType = 'primary' | 'success' | 'warning'

/** 素材类型 → 中文展示文案 */
export function typeLabel(t: string): string {
  switch (t) {
    case 'video':
      return '视频'
    case 'image':
      return '图片'
    case 'decor':
      return '装饰'
    default:
      return t
  }
}

/** 素材类型 → el-tag 样式 */
export function typeTagType(t: string): MaterialTagType {
  switch (t) {
    case 'video':
      return 'primary'
    case 'image':
      return 'success'
    case 'decor':
      return 'warning'
    default:
      return 'success'
  }
}

/** 文件大小 → 可读文本 */
export function formatSize(bytes: number): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/** 上传时间 → YYYY-MM-DD HH:mm（非法日期原样返回） */
export function formatTime(s: string): string {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 根据 MIME 自动推断素材类型 */
export function inferMaterialType(mime: string): MaterialType {
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  return 'decor'
}

/** 去掉文件扩展名，作为默认素材名称 */
export function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

/** 从异常中提取可展示信息，避免各 catch 分支重复 as any */
export function errorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const message = (e as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

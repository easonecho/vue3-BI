import { afterEach, describe, expect, it } from 'vitest'
import { useLang } from '@/i18n/composables'
import { formatDateTime } from './locale-format'

const VALUE = '2026-01-02T03:04:05Z'

describe('formatDateTime 按当前语言格式化', () => {
  afterEach(() => {
    useLang().setLocale('zh-CN')
    localStorage.clear()
  })

  it('中文环境使用 zh-CN 24 小时制', () => {
    useLang().setLocale('zh-CN')
    expect(formatDateTime(VALUE)).toBe(new Date(VALUE).toLocaleString('zh-CN', { hour12: false }))
  })

  it('英文环境使用 en-US 格式', () => {
    useLang().setLocale('en-US')
    expect(formatDateTime(VALUE)).toBe(new Date(VALUE).toLocaleString('en-US', { hour12: false }))
  })

  it('非法日期返回占位符', () => {
    expect(formatDateTime('not-a-date')).toBe('-')
  })
})

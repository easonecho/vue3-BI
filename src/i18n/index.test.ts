import { describe, expect, it } from 'vitest'
import { resolveInitialLocale } from './index'

describe('resolveInitialLocale 初始语言解析', () => {
  it('优先使用用户已保存的语言', () => {
    expect(resolveInitialLocale('en-US', 'zh-CN', 'zh-CN')).toBe('en-US')
    expect(resolveInitialLocale('zh-CN', 'en-US', 'en-US')).toBe('zh-CN')
  })

  it('其次使用部署配置的默认语言', () => {
    expect(resolveInitialLocale(null, 'en-US', 'zh-CN')).toBe('en-US')
    expect(resolveInitialLocale(null, 'zh-CN', 'en-US')).toBe('zh-CN')
  })

  it('未配置时按浏览器语言识别', () => {
    expect(resolveInitialLocale(null, undefined, 'en-GB')).toBe('en-US')
    expect(resolveInitialLocale(null, undefined, 'ja-JP')).toBe('zh-CN')
    expect(resolveInitialLocale(null, undefined, undefined)).toBe('zh-CN')
  })

  it('忽略非法或过期的存储值', () => {
    expect(resolveInitialLocale('fr-FR', undefined, 'en-US')).toBe('en-US')
  })
})

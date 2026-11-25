import { afterEach, describe, expect, it } from 'vitest'
import { useLang } from './composables'

describe('useLang 语言切换', () => {
  afterEach(() => {
    useLang().setLocale('zh-CN')
    localStorage.clear()
  })

  it('切换语言时同步 i18n、localStorage 与 html lang', () => {
    const { locale, setLocale } = useLang()

    setLocale('en-US')
    expect(locale.value).toBe('en-US')
    expect(localStorage.getItem('bi_locale')).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')

    setLocale('zh-CN')
    expect(locale.value).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
  })
})

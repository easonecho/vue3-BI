import { describe, expect, it } from 'vitest'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

type LocaleTree = { [key: string]: string | LocaleTree }

/** 展平语言包为 "a.b.c" → 文案, 便于校验中英文 key 一致 */
function flatten(tree: LocaleTree, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  Object.entries(tree).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      result[path] = value
    } else {
      Object.assign(result, flatten(value, path))
    }
  })
  return result
}

function emptyKeys(locale: string, tree: LocaleTree): string[] {
  return Object.entries(flatten(tree))
    .filter(([, text]) => text.trim() === '')
    .map(([key]) => `${locale}.${key}`)
}

describe('i18n 语言包', () => {
  it('中英文 key 完全一致', () => {
    const zhKeys = Object.keys(flatten(zhCN)).sort()
    const enKeys = Object.keys(flatten(enUS)).sort()
    expect(enKeys).toEqual(zhKeys)
  })

  it('不存在空文案', () => {
    expect([...emptyKeys('zh-CN', zhCN), ...emptyKeys('en-US', enUS)]).toEqual([])
  })
})

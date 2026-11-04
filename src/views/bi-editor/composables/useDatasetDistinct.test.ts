/**
 * 筛选器候选值工具函数单测
 */
import { describe, expect, it } from 'vitest'
import { buildDistinctCacheKey, toFilterOptions } from './useDatasetDistinct'

describe('toFilterOptions', () => {
  it('统一转字符串, 保持后端顺序', () => {
    expect(toFilterOptions(['华东', 1, true])).toEqual([
      { label: '华东', value: '华东' },
      { label: '1', value: '1' },
      { label: 'true', value: 'true' },
    ])
  })
})

describe('buildDistinctCacheKey', () => {
  it('登录态按数据集+字段+上限+关键字隔离', () => {
    expect(buildDistinctCacheKey(10, 'region', 200)).toBe('auth:10:region:200:')
    expect(buildDistinctCacheKey(10, 'region', 200, '华')).toBe('auth:10:region:200:华')
  })
})

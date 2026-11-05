/**
 * 筛选器候选值工具函数单测
 */
import { describe, expect, it } from 'vitest'
import {
  buildDistinctCacheKey,
  buildDistinctParamsKey,
  toFilterOptions,
} from './useDatasetDistinct'

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

  it('带级联参数时追加参数指纹', () => {
    expect(buildDistinctCacheKey(10, 'city', 200, '', '[["region","华东"]]')).toBe(
      'auth:10:city:200::[["region","华东"]]',
    )
  })
})

describe('buildDistinctParamsKey', () => {
  it('排序并忽略空值, 保证同条件同缓存', () => {
    expect(buildDistinctParamsKey({ region: '华东', city: '', year: null })).toBe(
      '[["region","华东"]]',
    )
    expect(buildDistinctParamsKey({ region: '华东', city: '上海' })).toBe(
      buildDistinctParamsKey({ city: '上海', region: '华东' }),
    )
  })

  it('无有效参数时返回空串', () => {
    expect(buildDistinctParamsKey(undefined)).toBe('')
    expect(buildDistinctParamsKey({ region: '' })).toBe('')
  })
})

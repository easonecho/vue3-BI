import { describe, it, expect } from 'vitest'
import { TOP_N_MAX, clampTopN, resolveTopNPolicy } from './useChartAggregation'

describe('clampTopN', () => {
  it('非法值 / 负数按 0 处理', () => {
    expect(clampTopN(undefined)).toBe(0)
    expect(clampTopN(null)).toBe(0)
    expect(clampTopN('abc')).toBe(0)
    expect(clampTopN(-5)).toBe(0)
  })

  it('小数取整, 超过上限截断', () => {
    expect(clampTopN(12.9)).toBe(12)
    expect(clampTopN(TOP_N_MAX + 100)).toBe(TOP_N_MAX)
    expect(clampTopN('20')).toBe(20)
  })
})

describe('resolveTopNPolicy', () => {
  const fallbackOrderBy = { field: 'category', direction: 'asc' as const }

  it('配置 Top-N 时按第一个度量排序并限制行数', () => {
    const result = resolveTopNPolicy({
      topN: 10,
      topNDirection: 'asc',
      metrics: ['sales', 'profit'],
      fallbackOrderBy,
      fallbackLimit: 2000,
    })
    expect(result).toEqual({
      orderBy: { field: 'sales', direction: 'asc' },
      limit: 10,
    })
  })

  it('Top-N 方向缺省为从大到小', () => {
    const result = resolveTopNPolicy({
      topN: 5,
      topNDirection: undefined,
      metrics: ['sales'],
      fallbackOrderBy,
      fallbackLimit: 2000,
    })
    expect(result.orderBy?.direction).toBe('desc')
    expect(result.limit).toBe(5)
  })

  it('Top-N 为 0 时沿用图表默认排序与 limit', () => {
    const result = resolveTopNPolicy({
      topN: 0,
      topNDirection: 'desc',
      metrics: ['sales'],
      fallbackOrderBy,
      fallbackLimit: 2000,
    })
    expect(result).toEqual({ orderBy: fallbackOrderBy, limit: 2000 })
  })

  it('没有度量字段时忽略 Top-N (避免生成无效排序)', () => {
    const result = resolveTopNPolicy({
      topN: 10,
      topNDirection: 'desc',
      metrics: [],
      fallbackOrderBy: undefined,
      fallbackLimit: 2000,
    })
    expect(result).toEqual({ orderBy: undefined, limit: 2000 })
  })
})

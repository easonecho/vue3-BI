import { describe, it, expect } from 'vitest'
import { buildDetailFilters, summarizeDetailFilters } from './drill-through'

describe('buildDetailFilters', () => {
  it('无任何过滤条件时返回空数组', () => {
    expect(buildDetailFilters({})).toEqual([])
  })

  it('全局筛选: 单值转 eq, 逗号分隔转 in, 日期区间转 between', () => {
    const filters = buildDetailFilters({
      globalFilters: {
        region: '华东',
        city: '上海,北京',
        date_start: '2026-01-01',
        date_end: '2026-03-31',
      },
    })
    expect(filters).toEqual([
      { field: 'region', operator: 'eq', value: '华东' },
      { field: 'city', operator: 'in', value: ['上海', '北京'] },
      { field: 'date', operator: 'between', value: ['2026-01-01', '2026-03-31'] },
    ])
  })

  it('联动筛选保留当前组件作为源的条目 (图表查询会排除, 明细不能排除)', () => {
    const filters = buildDetailFilters({
      linkFilters: [
        { sourceId: 'bar-1', field: 'region', value: '华东' },
        { sourceId: 'pie-1', field: 'city', value: '上海' },
      ],
    })
    expect(filters).toEqual([
      { field: 'region', operator: 'eq', value: '华东' },
      { field: 'city', operator: 'eq', value: '上海' },
    ])
  })

  it('钻取栈逐层等值过滤', () => {
    const filters = buildDetailFilters({
      drillFilters: [
        { field: 'region', value: '华东' },
        { field: 'city', value: '上海' },
      ],
    })
    expect(filters).toEqual([
      { field: 'region', operator: 'eq', value: '华东' },
      { field: 'city', operator: 'eq', value: '上海' },
    ])
  })

  it('额外点击项维度值追加 eq 条件', () => {
    const filters = buildDetailFilters({
      field: 'category',
      value: '手机',
      globalFilters: { region: '华东' },
    })
    expect(filters).toEqual([
      { field: 'region', operator: 'eq', value: '华东' },
      { field: 'category', operator: 'eq', value: '手机' },
    ])
  })

  it('空 field / 空 value 不追加点击条件', () => {
    for (const ctx of [
      { field: '', value: '手机' },
      { field: 'category', value: '' },
      { field: 'category', value: null },
      { field: undefined, value: '手机' },
    ]) {
      expect(buildDetailFilters(ctx)).toEqual([])
    }
  })

  it('重复条件去重 (全局筛选与联动同字段同值)', () => {
    const filters = buildDetailFilters({
      globalFilters: { region: '华东' },
      linkFilters: [{ sourceId: 'bar-1', field: 'region', value: '华东' }],
      drillFilters: [{ field: 'region', value: '华东' }],
    })
    expect(filters).toEqual([{ field: 'region', operator: 'eq', value: '华东' }])
  })
})

describe('summarizeDetailFilters', () => {
  it('输出等值 / 多选 / 区间可读标签', () => {
    const labels = summarizeDetailFilters([
      { field: 'region', operator: 'eq', value: '华东' },
      { field: 'city', operator: 'in', value: ['上海', '北京'] },
      { field: 'date', operator: 'between', value: ['2026-01-01', '2026-03-31'] },
      { field: 'memo', operator: 'isNull' },
    ])
    expect(labels).toEqual([
      'region = 华东',
      'city 包含 (上海, 北京)',
      'date 区间 2026-01-01 ~ 2026-03-31',
      'memo 为空',
    ])
  })

  it('未知操作符原样输出', () => {
    expect(
      summarizeDetailFilters([
        { field: 'amount', operator: 'unknown' as never, value: 100 },
      ]),
    ).toEqual(['amount unknown 100'])
  })
})

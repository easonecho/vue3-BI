import { describe, it, expect } from 'vitest'
import { buildAggregateFilters } from './aggregate-request'
import type { LinkFilter } from './linkage-filter'

const linkFilters: LinkFilter[] = [
  { sourceId: 'comp-a', field: 'city', value: '上海' },
]

describe('buildAggregateFilters 联动字段映射', () => {
  it('未配置映射时沿用源字段名', () => {
    expect(buildAggregateFilters({}, linkFilters, [], 'comp-b')).toEqual([
      { field: 'city', operator: 'eq', value: '上海' },
    ])
  })

  it('配置映射后使用当前组件的目标字段名', () => {
    expect(
      buildAggregateFilters({}, linkFilters, [], 'comp-b', { city: 'city_name' }),
    ).toEqual([{ field: 'city_name', operator: 'eq', value: '上海' }])
  })

  it('源组件自身仍被排除，不产生过滤条件', () => {
    expect(
      buildAggregateFilters({}, linkFilters, [], 'comp-a', { city: 'city_name' }),
    ).toEqual([])
  })
})

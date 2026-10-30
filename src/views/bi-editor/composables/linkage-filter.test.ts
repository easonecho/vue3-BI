import { describe, it, expect } from 'vitest'
import { applyRowFilters, type RowFilterContext, type FilterPrimitive } from './linkage-filter'

type Row = Record<string, unknown>

const rows: Row[] = [
  { region: '华东', city: '上海', amount: 100, date: '2026-01-05' },
  { region: '华东', city: '杭州', amount: 200, date: '2026-02-10' },
  { region: '华北', city: '北京', amount: 300, date: '2026-03-15' },
]

describe('applyRowFilters 空过滤器', () => {
  it('无任何过滤条件时返回原数组引用 (不做无意义拷贝)', () => {
    expect(applyRowFilters(rows, {})).toBe(rows)
  })

  it('globalFilters 为空对象、联动与钻取为空数组时仍返回原引用', () => {
    const ctx: RowFilterContext = { globalFilters: {}, linkFilters: [], drillFilters: [] }
    expect(applyRowFilters(rows, ctx)).toBe(rows)
  })
})

describe('applyRowFilters 全局筛选 (等值)', () => {
  it('按等值过滤', () => {
    const out = applyRowFilters(rows, { globalFilters: { region: '华东' } })
    expect(out).toHaveLength(2)
    expect(out.map((r) => r.city)).toEqual(['上海', '杭州'])
  })

  it('null / 空字符串不构成约束', () => {
    for (const v of [null, ''] as const) {
      expect(applyRowFilters(rows, { globalFilters: { region: v } })).toEqual(rows)
    }
  })

  it('undefined 值同样不构成约束 (运行时防御)', () => {
    // FilterPrimitive 类型不含 undefined, 但实现内部有防御性判断, 用断言构造该场景
    const ctx = {
      globalFilters: { region: undefined } as unknown as Record<string, FilterPrimitive>,
    }
    expect(applyRowFilters(rows, ctx)).toEqual(rows)
  })

  it('数字单元格与字符串筛选值可比较', () => {
    const out = applyRowFilters(rows, { globalFilters: { amount: '100' } })
    expect(out).toHaveLength(1)
    expect(out[0].city).toBe('上海')
  })

  it('字段不存在于数据行时忽略该条件 (避免误伤异构数据集)', () => {
    const out = applyRowFilters(rows, { globalFilters: { notExist: 'x' } })
    expect(out).toEqual(rows)
  })
})

describe('applyRowFilters 全局筛选 (逗号多选)', () => {
  it('逗号分隔多选命中任一值即保留', () => {
    const out = applyRowFilters(rows, { globalFilters: { city: '上海,北京' } })
    expect(out.map((r) => r.city)).toEqual(['上海', '北京'])
  })

  it('多选值带空格会被 trim', () => {
    const out = applyRowFilters(rows, { globalFilters: { city: '上海 , 北京' } })
    expect(out).toHaveLength(2)
  })

  it('多选值空项被忽略', () => {
    const out = applyRowFilters(rows, { globalFilters: { city: '上海,, ' } })
    expect(out.map((r) => r.city)).toEqual(['上海'])
  })

  it('多选无命中时结果为空', () => {
    expect(applyRowFilters(rows, { globalFilters: { city: '广州,深圳' } })).toHaveLength(0)
  })
})

describe('applyRowFilters 日期区间', () => {
  it('_start 与 _end 形成闭区间', () => {
    const out = applyRowFilters(rows, {
      globalFilters: { date_start: '2026-01-05', date_end: '2026-02-10' },
    })
    expect(out.map((r) => r.city)).toEqual(['上海', '杭州'])
  })

  it('仅设置 _start 时不约束上界', () => {
    const out = applyRowFilters(rows, { globalFilters: { date_start: '2026-02-01' } })
    expect(out.map((r) => r.city)).toEqual(['杭州', '北京'])
  })

  it('仅设置 _end 时不约束下界', () => {
    const out = applyRowFilters(rows, { globalFilters: { date_end: '2026-01-31' } })
    expect(out.map((r) => r.city)).toEqual(['上海'])
  })

  it('_start/_end 的值为空时跳过该区间', () => {
    const out = applyRowFilters(rows, {
      globalFilters: { date_start: '', date_end: '' },
    })
    expect(out).toEqual(rows)
  })

  it('区间字段不存在于数据行时忽略', () => {
    const out = applyRowFilters(rows, {
      globalFilters: { notExist_start: '2026-01-01', notExist_end: '2026-12-31' },
    })
    expect(out).toEqual(rows)
  })
})

describe('applyRowFilters 联动与钻取', () => {
  it('联动筛选排除源组件自身 (避免点击后把自己也过滤空)', () => {
    const out = applyRowFilters(rows, {
      componentId: 'comp-a',
      linkFilters: [{ sourceId: 'comp-a', field: 'region', value: '华东' }],
    })
    expect(out).toBe(rows)
  })

  it('联动筛选来自其他组件时生效', () => {
    const out = applyRowFilters(rows, {
      componentId: 'comp-b',
      linkFilters: [{ sourceId: 'comp-a', field: 'region', value: '华东' }],
    })
    expect(out).toHaveLength(2)
  })

  it('钻取筛选按等值匹配', () => {
    const out = applyRowFilters(rows, { drillFilters: [{ field: 'city', value: '北京' }] })
    expect(out).toHaveLength(1)
    expect(out[0].amount).toBe(300)
  })

  it('钻取字段不存在时忽略', () => {
    const out = applyRowFilters(rows, { drillFilters: [{ field: 'nope', value: 'x' }] })
    expect(out).toEqual(rows)
  })
})

describe('applyRowFilters 多条件组合 (AND)', () => {
  it('全局 + 钻取 + 联动同时生效', () => {
    const out = applyRowFilters(rows, {
      componentId: 'comp-b',
      globalFilters: { amount: '100,200,300', region_start: '' },
      drillFilters: [{ field: 'region', value: '华东' }],
      linkFilters: [{ sourceId: 'comp-a', field: 'city', value: '上海' }],
    })
    expect(out).toHaveLength(1)
    expect(out[0].city).toBe('上海')
  })

  it('任一条件不满足即被过滤', () => {
    const out = applyRowFilters(rows, {
      globalFilters: { region: '华东' },
      drillFilters: [{ field: 'city', value: '北京' }],
    })
    expect(out).toHaveLength(0)
  })
})

describe('applyRowFilters 不修改入参', () => {
  it('过滤后原数组长度不变', () => {
    const input = [...rows]
    applyRowFilters(input, { globalFilters: { region: '华东' } })
    expect(input).toHaveLength(3)
  })
})

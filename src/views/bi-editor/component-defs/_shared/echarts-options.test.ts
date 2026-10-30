import { describe, it, expect } from 'vitest'
import { deepMerge, mergeOptions, getBaseOption } from './echarts-options'

describe('getBaseOption', () => {
  it('返回空对象: 所有默认值唯一来源是 types.ts 的 schema', () => {
    expect(getBaseOption()).toEqual({})
  })
})

describe('deepMerge 基础语义', () => {
  it('specific 为 undefined 时返回 base 本身', () => {
    const base = { a: 1 }
    expect(deepMerge(base, undefined as any)).toBe(base)
  })

  it('base 为空时返回 specific 的值', () => {
    expect(deepMerge({} as { a?: number }, { a: 1 })).toEqual({ a: 1 })
  })

  it('对象字段递归合并, 未被覆盖的字段保留', () => {
    const base = { title: { show: true, text: 'a', fontSize: 12 } }
    const out = deepMerge(base, { title: { text: 'b' } } as any)
    expect(out).toEqual({ title: { show: true, text: 'b', fontSize: 12 } })
  })

  it('标量覆盖', () => {
    const out = deepMerge({ a: 1, b: 'x' }, { a: 2, b: 'y' })
    expect(out).toEqual({ a: 2, b: 'y' })
  })
})

describe('deepMerge 数组与空值语义', () => {
  it('数组整体替换而非按下标合并', () => {
    const out = deepMerge({ series: [{ type: 'bar' }, { type: 'line' }] }, { series: [{ type: 'pie' }] } as any)
    expect(out.series).toEqual([{ type: 'pie' }])
  })

  it('null 显式覆盖 (用于关闭 ECharts 某配置)', () => {
    const out = deepMerge({ tooltip: { show: true } }, { tooltip: null } as any)
    expect(out.tooltip).toBeNull()
  })

  it('specific 中的 undefined 被跳过, 不会抹掉 base 的值', () => {
    const out = deepMerge({ a: 1, b: 2 }, { a: 3, b: undefined } as any)
    expect(out).toEqual({ a: 3, b: 2 })
  })

  it('嵌套对象中的 undefined 同样被跳过', () => {
    const out = deepMerge({ title: { show: true, text: 'a' } }, { title: { text: undefined, fontSize: 14 } } as any)
    expect(out).toEqual({ title: { show: true, text: 'a', fontSize: 14 } })
  })
})

describe('deepMerge 不可变性', () => {
  it('不修改 base 的顶层字段', () => {
    const base = { a: 1, nested: { x: 1 } }
    deepMerge(base, { a: 2, nested: { x: 2 } } as any)
    expect(base.a).toBe(1)
    expect(base.nested.x).toBe(1)
  })

  it('不修改 specific 入参', () => {
    const specific = { a: 2, nested: { x: 2 } }
    const base = { a: 1, nested: { x: 1, y: 9 } }
    deepMerge(base, specific as any)
    expect(specific.a).toBe(2)
    expect(specific.nested).toEqual({ x: 2 })
  })

  it('返回的对象与 base 不是同一引用', () => {
    const base = { a: 1 }
    const out = deepMerge(base, { a: 2 })
    expect(out).not.toBe(base)
  })
})

describe('mergeOptions 兼容别名', () => {
  it('与 deepMerge 行为一致', () => {
    const base = { title: { show: true }, color: ['#1', '#2'] }
    expect(mergeOptions(base, { title: { show: false } } as any)).toEqual({
      title: { show: false },
      color: ['#1', '#2'],
    })
  })
})

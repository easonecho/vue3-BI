import { describe, it, expect } from 'vitest'
import { deepMerge, mergeOptions, getBaseOption } from './echarts-options'

/**
 * 🔑 测试专用窄化辅助：deepMerge 的 specific 形参是 `Partial<T>`（仅顶层可选），
 *   而本文件刻意传入「只给部分嵌套字段 / 用 null 覆盖」等非常规形状来验证容错行为。
 *   用它表达「这里故意违反类型」的意图，避免 `as any` 把类型信息全部丢掉。
 */
const partial = <T extends object>(value: unknown): Partial<T> => value as Partial<T>

describe('getBaseOption', () => {
  it('返回空对象: 所有默认值唯一来源是 types.ts 的 schema', () => {
    expect(getBaseOption()).toEqual({})
  })
})

describe('deepMerge 基础语义', () => {
  it('specific 为 undefined 时返回 base 本身', () => {
    const base = { a: 1 }
    expect(deepMerge(base, undefined)).toBe(base)
  })

  it('base 为空时返回 specific 的值', () => {
    expect(deepMerge({} as { a?: number }, { a: 1 })).toEqual({ a: 1 })
  })

  it('对象字段递归合并, 未被覆盖的字段保留', () => {
    const base = { title: { show: true, text: 'a', fontSize: 12 } }
    const out = deepMerge(base, partial<typeof base>({ title: { text: 'b' } }))
    expect(out).toEqual({ title: { show: true, text: 'b', fontSize: 12 } })
  })

  it('标量覆盖', () => {
    const out = deepMerge({ a: 1, b: 'x' }, { a: 2, b: 'y' })
    expect(out).toEqual({ a: 2, b: 'y' })
  })
})

describe('deepMerge 数组与空值语义', () => {
  it('数组整体替换而非按下标合并', () => {
    const base = { series: [{ type: 'bar' }, { type: 'line' }] }
    const out = deepMerge(base, partial<typeof base>({ series: [{ type: 'pie' }] }))
    expect(out.series).toEqual([{ type: 'pie' }])
  })

  it('null 显式覆盖 (用于关闭 ECharts 某配置)', () => {
    const base = { tooltip: { show: true } }
    const out = deepMerge(base, partial<typeof base>({ tooltip: null }))
    expect(out.tooltip).toBeNull()
  })

  it('specific 中的 undefined 被跳过, 不会抹掉 base 的值', () => {
    const base = { a: 1, b: 2 }
    const out = deepMerge(base, partial<typeof base>({ a: 3, b: undefined }))
    expect(out).toEqual({ a: 3, b: 2 })
  })

  it('嵌套对象中的 undefined 同样被跳过', () => {
    const base = { title: { show: true, text: 'a' } }
    const out = deepMerge(base, partial<typeof base>({ title: { text: undefined, fontSize: 14 } }))
    expect(out).toEqual({ title: { show: true, text: 'a', fontSize: 14 } })
  })
})

describe('deepMerge 不可变性', () => {
  it('不修改 base 的顶层字段', () => {
    const base = { a: 1, nested: { x: 1 } }
    deepMerge(base, partial<typeof base>({ a: 2, nested: { x: 2 } }))
    expect(base.a).toBe(1)
    expect(base.nested.x).toBe(1)
  })

  it('不修改 specific 入参', () => {
    const specific = { a: 2, nested: { x: 2 } }
    const base = { a: 1, nested: { x: 1, y: 9 } }
    deepMerge(base, partial<typeof base>(specific))
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
    expect(mergeOptions(base, { title: { show: false } })).toEqual({
      title: { show: false },
      color: ['#1', '#2'],
    })
  })
})

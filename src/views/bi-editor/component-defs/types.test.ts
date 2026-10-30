import { describe, it, expect } from 'vitest'
import { deriveDefaultProps, deriveDefaultPropsCached, type PropField } from './types'

/** 构造最小可用 schema */
function fields(): PropField[] {
  return [
    { key: 'title', label: '标题', type: 'input', default: '默认标题' },
    { key: 'fontSize', label: '字号', type: 'number', default: 12 },
    { key: 'showLegend', label: '显示图例', type: 'switch', default: true },
  ]
}

describe('deriveDefaultProps', () => {
  it('从 schema 的 default 派生默认值 (schema 是唯一真源)', () => {
    expect(deriveDefaultProps(fields())).toEqual({
      title: '默认标题',
      fontSize: 12,
      showLegend: true,
    })
  })

  it('extraDefaults 覆盖同名 schema 字段', () => {
    const out = deriveDefaultProps(fields(), { title: '覆写标题', fontSize: 20 })
    expect(out.title).toBe('覆写标题')
    expect(out.fontSize).toBe(20)
  })

  it('extraDefaults 可追加 schema 之外的字段 (如图表内嵌数据)', () => {
    const out = deriveDefaultProps(fields(), { series: [{ name: 'A', data: [] }] })
    expect(out.series).toEqual([{ name: 'A', data: [] }])
    expect(out.title).toBe('默认标题')
  })

  it('空 schema 且无 extra 时返回空对象', () => {
    expect(deriveDefaultProps([])).toEqual({})
  })

  it('默认值为 null / undefined / false 时也原样写入 (不被当作缺省丢弃)', () => {
    const out = deriveDefaultProps([
      { key: 'a', label: 'a', type: 'input', default: null },
      { key: 'b', label: 'b', type: 'input', default: undefined },
      { key: 'c', label: 'c', type: 'switch', default: false },
    ])
    expect(out).toEqual({ a: null, b: undefined, c: false })
    expect('b' in out).toBe(true)
  })
})

describe('deriveDefaultPropsCached', () => {
  it('def 为 undefined 时返回空对象', () => {
    expect(deriveDefaultPropsCached(undefined)).toEqual({})
  })

  it('结果与 deriveDefaultProps 一致', () => {
    const def = { propsSchema: fields(), extraDefaults: { title: 'x' } }
    expect(deriveDefaultPropsCached(def)).toEqual(deriveDefaultProps(fields(), { title: 'x' }))
  })

  it('同一 def 引用重复调用命中缓存且值相同', () => {
    const def = { propsSchema: fields() }
    const a = deriveDefaultPropsCached(def)
    const b = deriveDefaultPropsCached(def)
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
  })

  it('返回浅拷贝: 外部修改结果不污染缓存', () => {
    const def = { propsSchema: fields() }
    const first = deriveDefaultPropsCached(def)
    first.title = '被外部篡改'
    const second = deriveDefaultPropsCached(def)
    expect(second.title).toBe('默认标题')
  })

  it('不同 def 引用的缓存互不干扰', () => {
    const defA = { propsSchema: fields() }
    const defB = { propsSchema: [{ key: 'other', label: 'other', type: 'input' as const, default: 'B' }] }
    expect(deriveDefaultPropsCached(defA).title).toBe('默认标题')
    expect(deriveDefaultPropsCached(defB).other).toBe('B')
    expect(deriveDefaultPropsCached(defB).title).toBeUndefined()
  })
})

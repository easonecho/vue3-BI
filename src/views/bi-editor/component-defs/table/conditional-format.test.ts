import { describe, it, expect } from 'vitest'
import {
  buildConditionalCellStyle,
  buildDataBarGradient,
  computeColumnRange,
  computeDataBarMax,
  contrastTextColor,
  findMatchingRuleStyle,
  interpolateHexColor,
  matchesConditionalRule,
  toFiniteNumber,
} from './conditional-format'

const rows = [
  { region: '华东', amount: 100, status: '正常' },
  { region: '华南', amount: 300, status: '预警' },
  { region: '华北', amount: 200, status: '正常' },
]

describe('toFiniteNumber', () => {
  it('数字与数字字符串', () => {
    expect(toFiniteNumber(12)).toBe(12)
    expect(toFiniteNumber(' 3.5 ')).toBe(3.5)
  })

  it('空值/非法值返回 null', () => {
    expect(toFiniteNumber(null)).toBeNull()
    expect(toFiniteNumber(undefined)).toBeNull()
    expect(toFiniteNumber('')).toBeNull()
    expect(toFiniteNumber('abc')).toBeNull()
    expect(toFiniteNumber(Infinity)).toBeNull()
  })
})

describe('matchesConditionalRule', () => {
  it('数值比较 gt/gte/lt/lte/eq/ne', () => {
    expect(matchesConditionalRule(150, { operator: 'gt', value: '100' })).toBe(true)
    expect(matchesConditionalRule(100, { operator: 'gt', value: '100' })).toBe(false)
    expect(matchesConditionalRule(100, { operator: 'gte', value: '100' })).toBe(true)
    expect(matchesConditionalRule(90, { operator: 'lt', value: 100 })).toBe(true)
    expect(matchesConditionalRule(100, { operator: 'lte', value: 100 })).toBe(true)
    expect(matchesConditionalRule('100', { operator: 'eq', value: 100 })).toBe(true)
    expect(matchesConditionalRule(100, { operator: 'ne', value: 100 })).toBe(false)
  })

  it('between 支持上下界顺序颠倒', () => {
    expect(matchesConditionalRule(150, { operator: 'between', value: 100, value2: 200 })).toBe(true)
    expect(matchesConditionalRule(150, { operator: 'between', value: 200, value2: 100 })).toBe(true)
    expect(matchesConditionalRule(250, { operator: 'between', value: 100, value2: 200 })).toBe(false)
    expect(matchesConditionalRule(250, { operator: 'between', value: 100, value2: '' })).toBe(false)
  })

  it('contains 对字符串生效，对空值不命中', () => {
    expect(matchesConditionalRule('预警状态', { operator: 'contains', value: '预警' })).toBe(true)
    expect(matchesConditionalRule(null, { operator: 'contains', value: '预警' })).toBe(false)
  })

  it('非数值回退字符串比较', () => {
    expect(matchesConditionalRule('华东', { operator: 'eq', value: '华东' })).toBe(true)
    expect(matchesConditionalRule('华东', { operator: 'ne', value: '华南' })).toBe(true)
    expect(matchesConditionalRule('华东', { operator: 'gt', value: '华北' })).toBe(true)
  })

  it('未知操作符返回 false', () => {
    expect(matchesConditionalRule(100, { operator: 'unknown', value: 100 })).toBe(false)
  })
})

describe('findMatchingRuleStyle', () => {
  it('只匹配同字段规则，按顺序取第一条', () => {
    const rules = [
      { field: 'amount', operator: 'gt', value: 250, backgroundColor: '#fecaca' },
      { field: 'amount', operator: 'gt', value: 50, textColor: '#dc2626' },
      { field: 'status', operator: 'eq', value: '预警', backgroundColor: '#fef3c7' },
    ]
    expect(findMatchingRuleStyle(300, 'amount', rules)).toEqual({ backgroundColor: '#fecaca' })
    expect(findMatchingRuleStyle(100, 'amount', rules)).toEqual({ color: '#dc2626' })
    expect(findMatchingRuleStyle('预警', 'status', rules)).toEqual({
      backgroundColor: '#fef3c7',
    })
    expect(findMatchingRuleStyle(300, 'other', rules)).toBeNull()
  })

  it('命中但没有样式的规则会继续查找下一条', () => {
    const rules = [
      { field: 'amount', operator: 'gt', value: 100 },
      { field: 'amount', operator: 'gt', value: 50, bold: true },
    ]
    expect(findMatchingRuleStyle(150, 'amount', rules)).toEqual({ fontWeight: '600' })
  })

  it('无命中返回 null', () => {
    expect(findMatchingRuleStyle(10, 'amount', [])).toBeNull()
  })
})

describe('computeColumnRange / computeDataBarMax', () => {
  it('计算当前页数值范围，忽略非法值', () => {
    expect(computeColumnRange(rows, 'amount')).toEqual({ min: 100, max: 300 })
    expect(computeColumnRange([{ amount: '10' }, { amount: 'x' }], 'amount')).toEqual({
      min: 10,
      max: 10,
    })
  })

  it('字段无数据返回 null', () => {
    expect(computeColumnRange(rows, 'unknown')).toBeNull()
    expect(computeColumnRange([], 'amount')).toBeNull()
  })

  it('数据条量程：配置值优先，否则用最大值', () => {
    expect(computeDataBarMax(rows, { field: 'amount', maxValue: 500 })).toBe(500)
    expect(computeDataBarMax(rows, { field: 'amount', maxValue: 0 })).toBe(300)
    expect(computeDataBarMax(rows, { field: 'unknown' })).toBe(0)
  })
})

describe('色阶与数据条', () => {
  it('两色插值', () => {
    expect(interpolateHexColor('#000000', '#ffffff', 0)).toBe('#000000')
    expect(interpolateHexColor('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(interpolateHexColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(interpolateHexColor('#abc', '#abcdef', 0)).toBe('#aabbcc')
    expect(interpolateHexColor('not-a-color', '#ffffff', 0.5)).toBe('not-a-color')
  })

  it('根据亮度选择对比文字色', () => {
    expect(contrastTextColor('#ffffff')).toBe('#111827')
    expect(contrastTextColor('#dc2626')).toBe('#ffffff')
    expect(contrastTextColor('not-a-color')).toBe('#111827')
  })

  it('数据条按百分比生成渐变，0/负值不生成', () => {
    expect(buildDataBarGradient(50, { color: '#3b82f6', field: 'amount' }, 100)).toContain(
      '#3b82f6 50%',
    )
    expect(buildDataBarGradient(-1, { field: 'amount' }, 100)).toBeNull()
    expect(buildDataBarGradient(0, { field: 'amount' }, 100)).toBeNull()
    expect(buildDataBarGradient(10, { field: 'amount' }, 0)).toBeNull()
  })
})

describe('buildConditionalCellStyle', () => {
  const rules = [{ field: 'amount', operator: 'gt', value: 250, backgroundColor: '#fecaca' }]
  const scales = [{ field: 'amount', minColor: '#ffffff', maxColor: '#dc2626' }]
  const bars = [{ field: 'amount', color: '#3b82f6', maxValue: 0 }]

  it('字段为空返回空样式', () => {
    expect(buildConditionalCellStyle({ value: 100, field: '' })).toEqual({})
    expect(buildConditionalCellStyle({ value: 100, field: null })).toEqual({})
  })

  it('阈值规则优先于色阶', () => {
    const style = buildConditionalCellStyle({
      value: 300,
      field: 'amount',
      rules,
      scales,
      ranges: { amount: { min: 100, max: 300 } },
      bars: [],
    })
    expect(style).toEqual({ backgroundColor: '#fecaca' })
  })

  it('规则只配文字色时仍可叠加数据条', () => {
    const style = buildConditionalCellStyle({
      value: 200,
      field: 'amount',
      rules: [{ field: 'amount', operator: 'gt', value: 100, textColor: '#dc2626' }],
      bars,
      dataBarMax: { amount: 300 },
    })
    expect(style.color).toBe('#dc2626')
    expect(style.backgroundImage).toContain('66.67%')
  })

  it('数据条优先于色阶', () => {
    const style = buildConditionalCellStyle({
      value: 200,
      field: 'amount',
      scales,
      ranges: { amount: { min: 100, max: 300 } },
      bars,
      dataBarMax: { amount: 300 },
    })
    expect(style.backgroundImage).toBeDefined()
    expect(style.backgroundColor).toBeUndefined()
  })

  it('无规则/数据条时使用色阶并给出对比文字色', () => {
    const style = buildConditionalCellStyle({
      value: 300,
      field: 'amount',
      scales,
      ranges: { amount: { min: 100, max: 300 } },
    })
    expect(style.backgroundColor).toBe('#dc2626')
    expect(style.color).toBe('#ffffff')
  })

  it('规则/色阶/数据条均未命中时返回空样式', () => {
    expect(buildConditionalCellStyle({ value: 100, field: 'amount' })).toEqual({})
  })
})

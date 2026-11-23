import { describe, expect, it } from 'vitest'
import {
  applyChartConditionalFormat,
  applyConditionalColorsToData,
  matchesChartConditionalRule,
  resolveConditionalColor,
  resolveDataItemNumber,
  toFiniteNumber,
  type ChartConditionalRule,
} from './chart-conditional-format'

const rules: ChartConditionalRule[] = [
  { operator: 'gte', value: '80', color: '#ef4444' },
  { operator: 'lt', value: '20', color: '#22c55e' },
]

describe('toFiniteNumber', () => {
  it('数字与数字字符串正常解析', () => {
    expect(toFiniteNumber(12.5)).toBe(12.5)
    expect(toFiniteNumber(' 42 ')).toBe(42)
    expect(toFiniteNumber('-3')).toBe(-3)
  })

  it('空值 / 非数字 / 非有限值返回 null', () => {
    expect(toFiniteNumber(null)).toBeNull()
    expect(toFiniteNumber(undefined)).toBeNull()
    expect(toFiniteNumber('')).toBeNull()
    expect(toFiniteNumber('abc')).toBeNull()
    expect(toFiniteNumber(Number.NaN)).toBeNull()
    expect(toFiniteNumber(Infinity)).toBeNull()
  })
})

describe('resolveDataItemNumber', () => {
  it('支持数字 / 字符串 / 数组 / 对象 value', () => {
    expect(resolveDataItemNumber(10)).toBe(10)
    expect(resolveDataItemNumber('10')).toBe(10)
    expect(resolveDataItemNumber([3, 18])).toBe(18)
    expect(resolveDataItemNumber({ name: 'A', value: 7 })).toBe(7)
    expect(resolveDataItemNumber({ value: [1, 9] })).toBe(9)
  })

  it('无有效数值时返回 null', () => {
    expect(resolveDataItemNumber(null)).toBeNull()
    expect(resolveDataItemNumber('-')).toBeNull()
    expect(resolveDataItemNumber(['-', null])).toBeNull()
    expect(resolveDataItemNumber({ name: 'A' })).toBeNull()
  })
})

describe('matchesChartConditionalRule', () => {
  it('数值比较运算符', () => {
    expect(matchesChartConditionalRule(81, { operator: 'gt', value: 80 })).toBe(true)
    expect(matchesChartConditionalRule(80, { operator: 'gt', value: 80 })).toBe(false)
    expect(matchesChartConditionalRule(80, { operator: 'gte', value: 80 })).toBe(true)
    expect(matchesChartConditionalRule(19, { operator: 'lt', value: 20 })).toBe(true)
    expect(matchesChartConditionalRule(20, { operator: 'lte', value: '20' })).toBe(true)
    expect(matchesChartConditionalRule('80', { operator: 'eq', value: 80 })).toBe(true)
    expect(matchesChartConditionalRule(80, { operator: 'ne', value: 80 })).toBe(false)
  })

  it('between 支持上下限反序', () => {
    expect(matchesChartConditionalRule(50, { operator: 'between', value: 20, value2: 80 })).toBe(
      true,
    )
    expect(matchesChartConditionalRule(50, { operator: 'between', value: 80, value2: 20 })).toBe(
      true,
    )
    expect(matchesChartConditionalRule(90, { operator: 'between', value: 20, value2: 80 })).toBe(
      false,
    )
    expect(matchesChartConditionalRule(50, { operator: 'between', value: 20 })).toBe(false)
  })

  it('contains 按字符串包含匹配', () => {
    expect(matchesChartConditionalRule('华东区', { operator: 'contains', value: '华东' })).toBe(
      true,
    )
    expect(matchesChartConditionalRule('华南区', { operator: 'contains', value: '华东' })).toBe(
      false,
    )
    expect(matchesChartConditionalRule(null, { operator: 'contains', value: '华东' })).toBe(false)
  })

  it('非法运算符 / 非数值返回 false', () => {
    expect(matchesChartConditionalRule(10, { value: 1 })).toBe(false)
    expect(matchesChartConditionalRule(10, { operator: 'unknown', value: 1 })).toBe(false)
    expect(matchesChartConditionalRule('abc', { operator: 'gt', value: 1 })).toBe(false)
  })
})

describe('resolveConditionalColor', () => {
  it('按规则顺序取第一条命中且带颜色的规则', () => {
    expect(resolveConditionalColor(90, '销售额', rules)).toBe('#ef4444')
    expect(resolveConditionalColor(10, '销售额', rules)).toBe('#22c55e')
    expect(resolveConditionalColor(50, '销售额', rules)).toBeNull()
  })

  it('配置系列名后仅作用于同名系列', () => {
    const scoped: ChartConditionalRule[] = [
      { seriesName: '利润', operator: 'gt', value: 0, color: '#dc2626' },
    ]
    expect(resolveConditionalColor(10, '利润', scoped)).toBe('#dc2626')
    expect(resolveConditionalColor(10, '销售额', scoped)).toBeNull()
  })

  it('未配置颜色 / 非法规则被跳过', () => {
    const list: ChartConditionalRule[] = [
      { operator: 'gt', value: 0 },
      null as unknown as ChartConditionalRule,
      { operator: 'gt', value: 0, color: '  ' },
      { operator: 'gt', value: 0, color: '#2563eb' },
    ]
    expect(resolveConditionalColor(10, 'A', list)).toBe('#2563eb')
  })
})

describe('applyConditionalColorsToData', () => {
  it('数值数据点转换为 { value, itemStyle }', () => {
    const data = [10, 90]
    const out = applyConditionalColorsToData(data, '销售额', rules)
    expect(out).toEqual([
      { value: 10, itemStyle: { color: '#22c55e' } },
      { value: 90, itemStyle: { color: '#ef4444' } },
    ])
    expect(data).toEqual([10, 90])
  })

  it('对象数据点保留原字段并合并已有 itemStyle', () => {
    const data = [{ name: 'A', value: 90, itemStyle: { borderWidth: 1 } }]
    const out = applyConditionalColorsToData(data, '销售额', rules)
    expect(out).toEqual([
      {
        name: 'A',
        value: 90,
        itemStyle: { borderWidth: 1, color: '#ef4444' },
      },
    ])
  })

  it('数组数据点（散点）包装为对象形式', () => {
    const data = [[1, 90]]
    const out = applyConditionalColorsToData(data, '销售额', rules)
    expect(out).toEqual([{ value: [1, 90], itemStyle: { color: '#ef4444' } }])
  })

  it('未命中时返回原数组引用', () => {
    const data = [30, 40]
    expect(applyConditionalColorsToData(data, '销售额', rules)).toBe(data)
  })

  it('非数值数据点保持原样', () => {
    const data = ['-', null, { name: '无值' }]
    const out = applyConditionalColorsToData(data, '销售额', rules)
    expect(out).toEqual(['-', null, { name: '无值' }])
  })
})

describe('applyChartConditionalFormat', () => {
  it('未开启或无规则时不修改 option', () => {
    const option = { series: [{ type: 'bar', data: [90] }] }
    applyChartConditionalFormat(option, { show: false, rules })
    expect(option.series[0].data).toEqual([90])
    applyChartConditionalFormat(option, { show: true, rules: [] })
    expect(option.series[0].data).toEqual([90])
  })

  it('按系列名过滤并同时处理多个系列', () => {
    const option = {
      series: [
        { name: '销售额', type: 'bar', data: [90, 10] },
        { name: '利润', type: 'line', data: [90, 10] },
      ],
    }
    applyChartConditionalFormat(option, {
      show: true,
      rules: [{ seriesName: '销售额', operator: 'gt', value: 50, color: '#ef4444' }],
    })
    expect(option.series[0].data).toEqual([{ value: 90, itemStyle: { color: '#ef4444' } }, 10])
    expect(option.series[1].data).toEqual([90, 10])
  })

  it('兼容单个 series 对象与无 data 的系列', () => {
    const option = { series: { name: '销售额', type: 'pie', data: [{ name: 'A', value: 90 }] } }
    applyChartConditionalFormat(option, { show: true, rules })
    expect(option.series.data).toEqual([{ name: 'A', value: 90, itemStyle: { color: '#ef4444' } }])
    expect(() =>
      applyChartConditionalFormat({ series: [{ type: 'graph' }] }, { show: true, rules }),
    ).not.toThrow()
  })
})

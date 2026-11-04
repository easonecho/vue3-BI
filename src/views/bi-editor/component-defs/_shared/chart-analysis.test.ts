import { describe, it, expect } from 'vitest'
import {
  toNumericValue,
  extractSeriesValues,
  computeSharePercent,
  computeMom,
  computeYoy,
  formatPercent,
  buildSeriesAnalysis,
  buildSeriesAnalyses,
  buildAnalysisLines,
  escapeHtml,
} from './chart-analysis'

describe('toNumericValue', () => {
  it('支持 number / 数字字符串 / { value }', () => {
    expect(toNumericValue(12)).toBe(12)
    expect(toNumericValue('12.5')).toBe(12.5)
    expect(toNumericValue({ value: 3 })).toBe(3)
  })

  it('非法值返回 null', () => {
    expect(toNumericValue(undefined)).toBeNull()
    expect(toNumericValue(null)).toBeNull()
    expect(toNumericValue('abc')).toBeNull()
    expect(toNumericValue(NaN)).toBeNull()
    expect(toNumericValue({ value: 'x' })).toBeNull()
    expect(toNumericValue([1, 2])).toBeNull()
  })
})

describe('extractSeriesValues', () => {
  it('保持索引对齐并填充 null', () => {
    expect(extractSeriesValues([1, null, '-', { value: 4 }, '5'])).toEqual([
      1,
      null,
      null,
      4,
      5,
    ])
  })

  it('非数组返回空数组', () => {
    expect(extractSeriesValues(undefined)).toEqual([])
    expect(extractSeriesValues(12)).toEqual([])
  })
})

describe('computeSharePercent', () => {
  it('按系列总和计算百分比', () => {
    expect(computeSharePercent([25, 25, 50])).toEqual([25, 25, 50])
  })

  it('总和为 0 时全部返回 null', () => {
    expect(computeSharePercent([0, 0, null])).toEqual([null, null, null])
  })

  it('保留空值位置', () => {
    expect(computeSharePercent([10, null, 30])).toEqual([25, null, 75])
  })

  it('负值按代数和计算占比', () => {
    expect(computeSharePercent([-10, 30])).toEqual([-50, 150])
  })
})

describe('computeMom', () => {
  it('首项无环比, 其余与前一项目对比', () => {
    const result = computeMom([100, 120, 90])
    expect(result[0]).toBeNull()
    expect(result[1]).toBeCloseTo(20)
    expect(result[2]).toBeCloseTo(-25)
  })

  it('前值为 0 或空值时返回 null', () => {
    expect(computeMom([0, 10])).toEqual([null, null])
    expect(computeMom([null, 10])).toEqual([null, null])
  })
})

describe('computeYoy', () => {
  it('按配置间隔对比', () => {
    const values = [100, 110, 120, 150, 160, 180]
    const result = computeYoy(values, 3)
    expect(result.slice(0, 3)).toEqual([null, null, null])
    expect(result[3]).toBeCloseTo(50)
    expect(result[4]).toBeCloseTo(160 / 110 * 100 - 100)
    expect(result[5]).toBeCloseTo(50)
  })

  it('间隔非法时按 1 处理', () => {
    const result = computeYoy([100, 120], 0)
    expect(result[0]).toBeNull()
    expect(result[1]).toBeCloseTo(20)
  })

  it('基准为 0 时返回 null', () => {
    expect(computeYoy([0, 10, 20], 1)[1]).toBeNull()
  })
})

describe('formatPercent', () => {
  it('保留一位小数, 可带正号', () => {
    expect(formatPercent(12.345)).toBe('12.3%')
    expect(formatPercent(12.345, true)).toBe('+12.3%')
    expect(formatPercent(-5)).toBe('-5.0%')
    expect(formatPercent(0, true)).toBe('0.0%')
    expect(formatPercent(null)).toBe('-')
  })
})

describe('buildSeriesAnalysis', () => {
  it('只计算已开启的指标', () => {
    const result = buildSeriesAnalysis(
      { type: 'bar', data: [10, 20, 70] },
      { showPercent: true, showCompare: false },
    )
    expect(result?.percent).toEqual([10, 20, 70])
    expect(result?.mom).toBeUndefined()
    expect(result?.yoy).toBeUndefined()
  })

  it('同时计算占比与同环比', () => {
    const result = buildSeriesAnalysis(
      { type: 'line', data: [10, 20, 30] },
      { showPercent: true, showCompare: true, yoyLag: 2 },
    )
    expect(result?.percent).toEqual([10 / 60 * 100, 20 / 60 * 100, 30 / 60 * 100])
    expect(result?.mom?.[2]).toBeCloseTo(50)
    expect(result?.yoy?.[2]).toBeCloseTo(200)
  })

  it('不支持的系列类型/空数据返回 null', () => {
    expect(buildSeriesAnalysis({ type: 'pie', data: [1, 2] }, { showPercent: true })).toBeNull()
    expect(buildSeriesAnalysis({ type: 'scatter', data: [[1, 2]] }, { showCompare: true })).toBeNull()
    expect(buildSeriesAnalysis({ type: 'bar', data: [] }, { showPercent: true })).toBeNull()
  })
})

describe('buildSeriesAnalyses', () => {
  it('索引与 series 对齐', () => {
    const result = buildSeriesAnalyses(
      [
        { type: 'bar', data: [1, 2] },
        { type: 'pie', data: [1] },
        { type: 'line', data: [3, 4] },
      ],
      { showPercent: true },
    )
    expect(result).toHaveLength(3)
    expect(result[0]?.percent).toEqual([1 / 3 * 100, 2 / 3 * 100])
    expect(result[1]).toBeNull()
    expect(result[2]?.percent).toEqual([3 / 7 * 100, 4 / 7 * 100])
  })
})

describe('buildAnalysisLines', () => {
  const analysis = {
    percent: [10, 20],
    mom: [null, 15],
    yoy: [null, 30],
  }

  it('按开关输出对应行', () => {
    expect(buildAnalysisLines(analysis, 1, { showPercent: true, showCompare: true })).toEqual([
      '占比：20.0%',
      '环比：+15.0%',
      '同比：+30.0%',
    ])
    expect(buildAnalysisLines(analysis, 1, { showPercent: true })).toEqual(['占比：20.0%'])
    expect(buildAnalysisLines(analysis, 1, { showCompare: true })).toEqual([
      '环比：+15.0%',
      '同比：+30.0%',
    ])
  })

  it('无分析结果/无对应索引时返回空', () => {
    expect(buildAnalysisLines(null, 0, { showPercent: true })).toEqual([])
    expect(buildAnalysisLines(analysis, 0, { showCompare: true })).toEqual([
      '环比：-',
      '同比：-',
    ])
    expect(buildAnalysisLines(analysis, 99, { showPercent: true, showCompare: true })).toEqual([
      '占比：-',
      '环比：-',
      '同比：-',
    ])
  })
})

describe('escapeHtml', () => {
  it('转义特殊字符', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    )
  })
})

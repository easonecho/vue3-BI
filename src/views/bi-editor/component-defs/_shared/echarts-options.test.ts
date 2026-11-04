import { describe, it, expect } from 'vitest'
import {
  applyUserChartConfig,
  deepMerge,
  mergeOptions,
  getBaseOption,
  buildReferenceLineMarkLine,
  buildAnalysisTooltipHtml,
  applyAnalysisTooltip,
} from './echarts-options'
import type { ECOption } from './echarts-config'
import type { PropBag } from './props'

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

describe('buildReferenceLineMarkLine', () => {
  it('未开启时返回 null', () => {
    expect(buildReferenceLineMarkLine({ show: false, value: 100 })).toBeNull()
    expect(buildReferenceLineMarkLine({ value: 100 })).toBeNull()
  })

  it('参考值非法时返回 null', () => {
    expect(buildReferenceLineMarkLine({ show: true, value: 'abc' })).toBeNull()
    expect(buildReferenceLineMarkLine({ show: true, value: undefined })).toBeNull()
    expect(buildReferenceLineMarkLine({ show: true, value: Infinity })).toBeNull()
  })

  it('默认颜色与标签: 标签留空时显示参考值', () => {
    const markLine = buildReferenceLineMarkLine({ show: true, value: 120 })
    if (!markLine) throw new Error('未生成参考线')
    expect(markLine).toMatchObject({
      silent: true,
      symbol: 'none',
      lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 },
      data: [{ yAxis: 120 }],
    })
    expect(markLine.label).toMatchObject({ show: true, position: 'insideEnd' })
    const formatter = (markLine.label as { formatter: () => string }).formatter
    expect(formatter()).toBe('120')
  })

  it('自定义颜色与标签', () => {
    const markLine = buildReferenceLineMarkLine({
      show: true,
      value: 80,
      label: '目标线',
      color: '#2563eb',
    })
    if (!markLine) throw new Error('未生成参考线')
    expect(markLine.lineStyle).toMatchObject({ color: '#2563eb' })
    const formatter = (markLine.label as { formatter: () => string }).formatter
    expect(formatter()).toBe('目标线')
  })
})

describe('applyUserChartConfig 图表注释', () => {
  function merge(props: PropBag, series: Array<Record<string, unknown>>) {
    return applyUserChartConfig(
      {},
      props,
      { series } as unknown as ECOption,
      { hasAxes: true },
    )
  }

  it('文本注释注入 graphic', () => {
    const merged = merge(
      { annotationShow: true, annotationType: 'text', annotationText: '本月峰值' } as PropBag,
      [{ type: 'bar', data: [10, 20] }],
    )
    const graphic = (merged as Record<string, unknown>).graphic as Array<Record<string, unknown>>
    expect(graphic).toHaveLength(1)
    expect(graphic[0]).toMatchObject({ type: 'text', style: { text: '本月峰值' } })
  })

  it('标记点挂到 bar 系列', () => {
    const merged = merge(
      { annotationShow: true, annotationType: 'markPoint', annotationValue: 20 } as PropBag,
      [{ type: 'bar', data: [10, 20] }],
    )
    const series = merged.series as Array<Record<string, unknown>>
    expect(series[0].markPoint).toMatchObject({ data: [{ yAxis: 20, name: '' }] })
  })
})

describe('buildAnalysisTooltipHtml', () => {
  const analyses = [
    { percent: [25, 75], mom: [null, 100], yoy: [null, -50] },
    null,
  ]
  const params = [
    {
      seriesIndex: 0,
      dataIndex: 1,
      seriesName: '销售额',
      value: 300,
      marker: '<span style="color:red"></span>',
      axisValue: '2月',
    },
  ]

  it('完整 tooltip 包含类目、数值与占比/同环比', () => {
    const html = buildAnalysisTooltipHtml(
      params,
      analyses,
      { showPercent: true, showCompare: true },
      true,
    )
    expect(html).toContain('2月')
    expect(html).toContain('销售额')
    expect(html).toContain('300')
    expect(html).toContain('占比：75.0%')
    expect(html).toContain('环比：+100.0%')
    expect(html).toContain('同比：-50.0%')
    // 正增长绿色 / 负增长红色
    expect(html).toContain('#16a34a')
    expect(html).toContain('#dc2626')
  })

  it('includeBase=false 时只输出分析行', () => {
    const html = buildAnalysisTooltipHtml(
      params,
      analyses,
      { showPercent: true },
      false,
    )
    expect(html).not.toContain('2月')
    expect(html).not.toContain('销售额')
    expect(html).toContain('占比：75.0%')
  })

  it('系列名与类目做 HTML 转义', () => {
    const html = buildAnalysisTooltipHtml(
      [{ seriesIndex: 0, dataIndex: 0, seriesName: '<b>x</b>', value: 1, axisValue: '<i>y</i>' }],
      [{ percent: [100] }],
      { showPercent: true },
      true,
    )
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain('&lt;i&gt;y&lt;/i&gt;')
    expect(html).not.toContain('<b>x</b>')
  })

  it('空参数返回空字符串', () => {
    expect(buildAnalysisTooltipHtml([], analyses, { showPercent: true }, true)).toBe('')
  })
})

describe('applyAnalysisTooltip', () => {
  function makeOption(extra: Record<string, unknown> = {}): ECOption {
    return {
      tooltip: { trigger: 'axis' },
      series: [{ type: 'bar', data: [10, 20, 70] }],
      ...extra,
    } as unknown as ECOption
  }

  function tooltipOf(option: ECOption): { formatter?: unknown } {
    return (Array.isArray(option.tooltip) ? option.tooltip[0] : option.tooltip) as {
      formatter?: unknown
    }
  }

  function paramsOf(axisValue = '3月') {
    return [
      { seriesIndex: 0, dataIndex: 2, seriesName: '销售额', value: 70, axisValue },
    ]
  }

  it('未开启时保持 tooltip 原样', () => {
    const option = makeOption()
    applyAnalysisTooltip(option, {} as PropBag)
    expect(tooltipOf(option).formatter).toBeUndefined()
  })

  it('开启后生成 formatter 并返回完整 tooltip', () => {
    const option = makeOption()
    applyAnalysisTooltip(option, {
      sharePercentShow: true,
      compareShow: true,
      compareYoyLag: 2,
    } as PropBag)
    const formatter = tooltipOf(option).formatter as (params: unknown) => string
    const html = formatter(paramsOf())
    expect(html).toContain('3月')
    expect(html).toContain('占比：70.0%')
    expect(html).toContain('环比：+250.0%')
    expect(html).toContain('同比：+600.0%')
  })

  it('已有函数 formatter 时保留原内容并追加分析行', () => {
    const option = makeOption({
      tooltip: { trigger: 'axis', formatter: (p: Array<{ axisValue: string }>) => `raw:${p[0].axisValue}` },
    })
    applyAnalysisTooltip(option, {
      sharePercentShow: true,
      compareShow: true,
      compareYoyLag: 2,
    } as PropBag)
    const formatter = tooltipOf(option).formatter as (params: unknown) => string
    const html = formatter(paramsOf())
    expect(html).toContain('raw:3月')
    expect(html).toContain('占比：70.0%')
    expect(html).not.toContain('font-weight:600;margin-bottom:4px')
  })

  it('字符串模板 formatter 保持不变', () => {
    const option = makeOption({ tooltip: { trigger: 'axis', formatter: '{b}: {c}' } })
    applyAnalysisTooltip(option, { sharePercentShow: true } as PropBag)
    expect(tooltipOf(option).formatter).toBe('{b}: {c}')
  })

  it('没有可分析系列时不修改 tooltip', () => {
    const option = {
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', data: [1, 2] }],
    } as unknown as ECOption
    applyAnalysisTooltip(option, { sharePercentShow: true } as PropBag)
    expect(tooltipOf(option).formatter).toBeUndefined()
  })
})

import { describe, it, expect } from 'vitest'
import {
  applyChartAnnotation,
  buildMarkPointAnnotation,
  buildTextAnnotation,
} from './chart-annotation'

describe('buildMarkPointAnnotation', () => {
  it('未开启或类型不是 markPoint 时返回 null', () => {
    expect(buildMarkPointAnnotation({ show: false, type: 'markPoint', text: '峰值' })).toBeNull()
    expect(buildMarkPointAnnotation({ show: true, type: 'text', text: '峰值' })).toBeNull()
  })

  it('值留空/为 0 时标记该系列最大值', () => {
    const markPoint = buildMarkPointAnnotation({ show: true, type: 'markPoint', text: '峰值' })
    if (!markPoint) throw new Error('未生成标记点')
    expect(markPoint.data).toEqual([{ type: 'max', name: '峰值' }])
    expect(markPoint).toMatchObject({
      symbol: 'pin',
      itemStyle: { color: '#ef4444' },
      label: { show: true, formatter: '峰值', color: '#ffffff', fontSize: 12 },
    })
  })

  it('指定数值时定位到 Y 轴该值', () => {
    const markPoint = buildMarkPointAnnotation({
      show: true,
      type: 'markPoint',
      value: 120,
      text: '目标',
      color: '#2563eb',
      fontSize: 14,
    })
    if (!markPoint) throw new Error('未生成标记点')
    expect(markPoint.data).toEqual([{ yAxis: 120, name: '目标' }])
    expect(markPoint.itemStyle).toEqual({ color: '#2563eb' })
    expect(markPoint.label).toMatchObject({ fontSize: 14 })
  })

  it('文本为空时隐藏标签', () => {
    const markPoint = buildMarkPointAnnotation({ show: true, type: 'markPoint', value: 80 })
    if (!markPoint) throw new Error('未生成标记点')
    expect(markPoint.label).toMatchObject({ show: false })
  })
})

describe('buildTextAnnotation', () => {
  it('未开启 / 类型不是 text / 文本为空时返回 null', () => {
    expect(buildTextAnnotation({ show: false, type: 'text', text: '说明' })).toBeNull()
    expect(buildTextAnnotation({ show: true, type: 'markPoint', text: '说明' })).toBeNull()
    expect(buildTextAnnotation({ show: true, type: 'text', text: '  ' })).toBeNull()
  })

  it('按百分比定位并限制在 0-100', () => {
    const annotation = buildTextAnnotation({
      show: true,
      type: 'text',
      text: '本月峰值',
      left: 120,
      top: -10,
      color: '#16a34a',
      fontSize: 18,
    })
    if (!annotation) throw new Error('未生成文本注释')
    expect(annotation).toMatchObject({
      type: 'text',
      left: '100%',
      top: '0%',
      style: { text: '本月峰值', fill: '#16a34a', fontSize: 18, fontWeight: 'bold' },
    })
  })

  it('非法位置使用默认值', () => {
    const annotation = buildTextAnnotation({
      show: true,
      type: 'text',
      text: '说明',
      left: 'abc',
      top: undefined,
    })
    if (!annotation) throw new Error('未生成文本注释')
    expect(annotation.left).toBe('70%')
    expect(annotation.top).toBe('12%')
  })
})

describe('applyChartAnnotation', () => {
  it('文本注释追加到已有 graphic，不覆盖原有内容', () => {
    const existing = { type: 'text', left: '10%', style: { text: '旧注释' } }
    const option = { graphic: existing }
    const applied = applyChartAnnotation(option, {
      show: true,
      type: 'text',
      text: '新注释',
    })
    expect(applied).toBe(true)
    expect(option.graphic).toEqual([existing, expect.objectContaining({ style: expect.objectContaining({ text: '新注释' }) })])
  })

  it('标记点挂到第一个 bar/line/scatter 系列', () => {
    const pieSeries = { type: 'pie', data: [1, 2] }
    const barSeries = { type: 'bar', data: [10, 20] }
    const option = { series: [pieSeries, barSeries] }
    const applied = applyChartAnnotation(option, { show: true, type: 'markPoint', value: 20 })
    expect(applied).toBe(true)
    expect(barSeries).toMatchObject({ markPoint: { data: [{ yAxis: 20, name: '' }] } })
    expect(pieSeries).not.toHaveProperty('markPoint')
  })

  it('没有可挂载的系列时返回 false', () => {
    const option = { series: [{ type: 'pie', data: [1] }] }
    expect(applyChartAnnotation(option, { show: true, type: 'markPoint' })).toBe(false)
  })

  it('未开启时不注入', () => {
    const option = { series: [{ type: 'bar', data: [1] }] }
    expect(applyChartAnnotation(option, { show: false, type: 'markPoint' })).toBe(false)
    expect(option.series[0]).not.toHaveProperty('markPoint')
  })
})

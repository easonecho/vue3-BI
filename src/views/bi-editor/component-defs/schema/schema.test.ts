import { describe, it, expect } from 'vitest'
import type { Component } from 'vue'
import type { ComponentDefinition, PropField } from './props'
import {
  AGGREGATE_OPTIONS,
  DEFAULT_FONT_FAMILY,
  ECHARTS_DEFAULT_PALETTE,
  FONT_FAMILY_OPTIONS,
} from './options'
import {
  aggregatePropField,
  baseSeriesStylesNoAxesColumns,
  baseSeriesStylesWithAxesColumns,
} from './presets'
import { buildInitialSeriesStyles, isFieldVisible } from './defaults'
import {
  buildSeriesLabelSchema,
  chartAxesSchema,
  chartBaseSchema,
  chartCommonSchema,
} from './chart'
import { textBaseSchema } from './text'

/** 按 key 升序收集，便于断言 schema 字段顺序与唯一性 */
function keysOf(fields: PropField[]): string[] {
  return fields.map((f) => f.key)
}

describe('组件 Schema 组合', () => {
  it('chartCommonSchema 按「标题 / 图例 / 提示框 / 动画 / 画布内边距 / 注释」顺序组合', () => {
    const keys = keysOf(chartCommonSchema)
    expect(keys[0]).toBe('titleShow')
    expect(keys).toContain('legendShow')
    expect(keys).toContain('tooltipShow')
    expect(keys).toContain('animationShow')
    expect(keys).toContain('gridContainLabel')
    expect(keys[keys.indexOf('gridContainLabel') + 1]).toBe('annotationShow')
    expect(keys[keys.length - 1]).toBe('annotationFontSize')
  })

  it('chartAxesSchema 按「X 轴 / Y 轴 / 数据缩放 / 数据对比 / 参考线」顺序组合', () => {
    const keys = keysOf(chartAxesSchema)
    expect(keys[0]).toBe('xAxisShow')
    expect(keys[keys.indexOf('xAxisInverse') + 1]).toBe('yAxisShow')
    expect(keys[keys.indexOf('yAxisInverse') + 1]).toBe('dataZoomShow')
    expect(keys[keys.indexOf('dataZoomEnd') + 1]).toBe('sharePercentShow')
    expect(keys[keys.indexOf('compareYoyLag') + 1]).toBe('referenceLineShow')
    expect(keys[keys.length - 1]).toBe('referenceLineColor')
  })

  it('chartBaseSchema 等价于 通用 + 坐标轴 的拼接', () => {
    expect(chartBaseSchema).toEqual([...chartCommonSchema, ...chartAxesSchema])
    expect(chartBaseSchema).toHaveLength(chartCommonSchema.length + chartAxesSchema.length)
  })

  it('三套图表 Schema 均无重复 key', () => {
    for (const schema of [chartCommonSchema, chartAxesSchema, chartBaseSchema]) {
      const keys = keysOf(schema)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('textBaseSchema 保留文本类默认值', () => {
    expect(keysOf(textBaseSchema)).toEqual([
      'text',
      'fontSize',
      'fontWeight',
      'color',
      'textAlign',
      'lineHeight',
    ])
    const byKey = (key: string) => textBaseSchema.find((f) => f.key === key)
    expect(byKey('text')?.default).toBe('文本内容')
    expect(byKey('fontSize')?.default).toBe(14)
    expect(byKey('fontSize')?.min).toBe(10)
    expect(byKey('fontSize')?.max).toBe(72)
    expect(byKey('color')?.default).toBe('#333333')
    expect(byKey('textAlign')?.default).toBe('left')
    expect(byKey('lineHeight')?.default).toBe(1.5)
    expect(byKey('lineHeight')?.step).toBe(0.1)
  })
})

describe('buildSeriesLabelSchema', () => {
  it('默认按「字体 / 字号 / 字重 / 斜体 / 颜色 / 标签位置」输出', () => {
    expect(keysOf(buildSeriesLabelSchema())).toEqual([
      'seriesLabelFontFamily',
      'seriesLabelFontSize',
      'seriesLabelFontWeight',
      'seriesLabelFontStyle',
      'seriesLabelColor',
      'seriesLabelPosition',
    ])
  })

  it('标签位置默认 top，可被图表覆盖', () => {
    expect(buildSeriesLabelSchema()[5].default).toBe('top')
    expect(buildSeriesLabelSchema('inside')[5].default).toBe('inside')
    expect(buildSeriesLabelSchema().every((f) => f.group === '系列标签')).toBe(true)
  })
})

describe('公共选项与预设', () => {
  it('调色板为 9 色且默认字体取自字体选项第一项', () => {
    expect(ECHARTS_DEFAULT_PALETTE).toHaveLength(9)
    expect(DEFAULT_FONT_FAMILY).toBe(FONT_FAMILY_OPTIONS[0].value)
  })

  it('聚合选项覆盖 none / sum / avg / count / countDistinct / max / min', () => {
    expect(AGGREGATE_OPTIONS.map((o) => o.value)).toEqual([
      'none',
      'sum',
      'avg',
      'count',
      'countDistinct',
      'max',
      'min',
    ])
  })

  it('aggregatePropField 的 key / 默认值 / 分组保持不变', () => {
    expect(aggregatePropField.key).toBe('aggregate')
    expect(aggregatePropField.default).toBe('sum')
    expect(aggregatePropField.group).toBe('数据聚合')
    expect(aggregatePropField.options).toEqual([...AGGREGATE_OPTIONS])
  })

  it('seriesStyles 列定义保留名称列 / 颜色列 / 标签列', () => {
    expect(baseSeriesStylesWithAxesColumns.map((c) => c.key)).toEqual([
      'seriesName',
      'color',
      'labelShow',
    ])
    expect(baseSeriesStylesNoAxesColumns.map((c) => c.key)).toEqual(['name', 'color', 'labelShow'])
  })
})

describe('isFieldVisible', () => {
  it('无 visibleWhen 时始终可见', () => {
    expect(isFieldVisible({ key: 'a', label: 'a', type: 'input', default: '' }, {})).toBe(true)
  })

  it('equals 精确匹配', () => {
    const field: PropField = {
      key: 'b',
      label: 'b',
      type: 'input',
      default: '',
      visibleWhen: { field: 'mode', equals: 'advanced' },
    }
    expect(isFieldVisible(field, { mode: 'advanced' })).toBe(true)
    expect(isFieldVisible(field, { mode: 'basic' })).toBe(false)
  })

  it('in 命中任一值', () => {
    const field: PropField = {
      key: 'b',
      label: 'b',
      type: 'input',
      default: '',
      visibleWhen: { field: 'type', in: ['bar', 'line'] },
    }
    expect(isFieldVisible(field, { type: 'bar' })).toBe(true)
    expect(isFieldVisible(field, { type: 'pie' })).toBe(false)
  })

  it('truthy 要求依赖值真值状态一致', () => {
    const field: PropField = {
      key: 'b',
      label: 'b',
      type: 'input',
      default: '',
      visibleWhen: { field: 'show', truthy: true },
    }
    expect(isFieldVisible(field, { show: true })).toBe(true)
    expect(isFieldVisible(field, { show: false })).toBe(false)
    expect(isFieldVisible(field, {})).toBe(false)
  })
})

describe('buildInitialSeriesStyles', () => {
  const seriesColumns = baseSeriesStylesWithAxesColumns

  function makeDef(type: ComponentDefinition['type'], columns = seriesColumns): ComponentDefinition {
    return {
      type,
      meta: { name: '测试', category: 'chart', icon: '', defaultWidth: 400, defaultHeight: 300 },
      widget: {} as Component,
      propsSchema: [
        {
          key: 'seriesStyles',
          label: '系列样式',
          type: 'table',
          default: [],
          columns,
        },
      ],
    }
  }

  it('schema 中没有 seriesStyles 字段时返回 undefined', () => {
    const def: ComponentDefinition = {
      type: 'bar-chart',
      meta: { name: '测试', category: 'chart', icon: '', defaultWidth: 400, defaultHeight: 300 },
      widget: {} as Component,
      propsSchema: [],
    }
    expect(buildInitialSeriesStyles(def, {})).toBeUndefined()
  })

  it('用户已配置的 seriesStyles 原样保留', () => {
    const existing = [{ seriesName: 'A', color: '#000', labelShow: true }]
    expect(buildInitialSeriesStyles(makeDef('bar-chart'), { seriesStyles: existing })).toBe(existing)
  })

  it('带轴图表从 series 生成行，颜色按调色板循环', () => {
    const props = { series: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }] }
    const rows = buildInitialSeriesStyles(makeDef('bar-chart'), props)
    expect(rows).toHaveLength(4)
    expect(rows?.[0]).toEqual({
      seriesName: 'A',
      color: ECHARTS_DEFAULT_PALETTE[0],
      labelShow: false,
    })
    expect(rows?.[1].color).toBe(ECHARTS_DEFAULT_PALETTE[1])
    expect(rows?.[2].color).toBe(ECHARTS_DEFAULT_PALETTE[2])
    expect(rows?.[3].color).toBe(ECHARTS_DEFAULT_PALETTE[3])
  })

  it('饼图从 pieData 生成行，并按列类型填充空值', () => {
    const props = { pieData: [{ name: 'A' }, { name: 'B' }] }
    const rows = buildInitialSeriesStyles(
      makeDef('pie-chart', baseSeriesStylesNoAxesColumns),
      props,
    )
    expect(rows).toEqual([
      { name: 'A', color: ECHARTS_DEFAULT_PALETTE[0], labelShow: false },
      { name: 'B', color: ECHARTS_DEFAULT_PALETTE[1], labelShow: false },
    ])
  })

  it('颜色超过 9 项后循环回第一色', () => {
    const series = Array.from({ length: 10 }, (_, i) => ({ name: `S${i}` }))
    const rows = buildInitialSeriesStyles(makeDef('line-chart'), { series })
    expect(rows?.[9].color).toBe(ECHARTS_DEFAULT_PALETTE[0])
  })

  it('number / select / input 列按列定义填充默认值', () => {
    const def = makeDef('bar-chart', [
      { key: 'seriesName', label: '系列名称', type: 'input' },
      { key: 'lineWidth', label: '线宽', type: 'number', min: 2 },
      {
        key: 'lineType',
        label: '线型',
        type: 'select',
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
        ],
      },
      { key: 'note', label: '备注', type: 'input' },
    ])
    const rows = buildInitialSeriesStyles(def, { series: [{ name: 'A' }] })
    expect(rows?.[0]).toEqual({ seriesName: 'A', lineWidth: 2, lineType: 'solid', note: '' })
  })

  it('数据源缺失时返回空数组', () => {
    expect(buildInitialSeriesStyles(makeDef('bar-chart'), {})).toEqual([])
  })
})

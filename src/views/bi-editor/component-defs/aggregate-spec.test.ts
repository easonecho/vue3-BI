import { describe, it, expect } from 'vitest'
import type { ComponentInstance } from '../types'
import {
  resolveComponentAggregateSpec,
  resolveComponentFieldMapping,
  resolveComponentMetricMapping,
} from './aggregate-spec'

/** 构造最小可用组件 (只关心聚合规格所需的字段) */
function comp(type: string, dataConfig: Record<string, unknown>, props: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    type,
    name: type,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    zIndex: 1,
    visible: true,
    locked: false,
    props,
    style: {},
    dataSource: { datasetId: 1 },
    dataConfig,
  } as unknown as ComponentInstance
}

describe('resolveComponentAggregateSpec', () => {
  it('柱状图: 按类目分组 + 多度量求和', () => {
    expect(
      resolveComponentAggregateSpec(
        comp('bar-chart', { categoryField: '月份', valueFields: ['销售额', '利润'] }),
      ),
    ).toEqual({
      groupBy: ['月份'],
      metrics: [
        { field: '销售额', aggregate: 'sum', alias: '销售额' },
        { field: '利润', aggregate: 'sum', alias: '利润' },
      ],
      orderBy: { field: '月份', direction: 'asc' },
      limit: 2000,
    })
  })

  it('Top-N 覆盖默认排序与行数, 按第一个度量倒序', () => {
    expect(
      resolveComponentAggregateSpec(
        comp('bar-chart', { categoryField: '城市', valueFields: ['销售额'] }, { topN: 10 }),
      ),
    ).toMatchObject({
      orderBy: { field: '销售额', direction: 'desc' },
      limit: 10,
    })
  })

  it('饼图按名称分组、按值倒序', () => {
    expect(
      resolveComponentAggregateSpec(comp('pie-chart', { nameField: '渠道', valueField: '金额' })),
    ).toMatchObject({
      groupBy: ['渠道'],
      metrics: [{ field: '金额', aggregate: 'sum', alias: '金额' }],
      orderBy: { field: '金额', direction: 'desc' },
    })
  })

  it('组合图取柱/线两个度量', () => {
    expect(
      resolveComponentAggregateSpec(
        comp('combo-chart', { categoryField: '日期', barField: '销量', lineField: '均价' }),
      ),
    ).toMatchObject({
      groupBy: ['日期'],
      metrics: [
        { field: '销量', aggregate: 'sum', alias: '销量' },
        { field: '均价', aggregate: 'sum', alias: '均价' },
      ],
    })
  })

  it('桑基图按来源 + 目标双维度分组', () => {
    expect(
      resolveComponentAggregateSpec(
        comp('sankey-chart', { sourceField: '来源', targetField: '去向', valueField: '流量' }),
      ),
    ).toMatchObject({ groupBy: ['来源', '去向'], metrics: [{ field: '流量' }] })
  })

  it('排行榜按值倒序且上限 500 行', () => {
    expect(
      resolveComponentAggregateSpec(comp('rank-list', { categoryField: '商品', valueField: '销量' })),
    ).toMatchObject({ orderBy: { field: '销量', direction: 'desc' }, limit: 500 })
  })

  it('KPI 卡为无分组单指标', () => {
    expect(
      resolveComponentAggregateSpec(
        comp('kpi-card', { valueField: '销售额' }, { aggregate: 'avg' }),
      ),
    ).toEqual({
      groupBy: [],
      metrics: [{ field: '销售额', aggregate: 'avg', alias: 'value' }],
      limit: 1,
    })
  })

  it('不聚合 / 字段缺失 / 未知组件不产出规格', () => {
    expect(
      resolveComponentAggregateSpec(
        comp('bar-chart', { categoryField: '月份', valueFields: ['销售额'] }, { aggregate: 'none' }),
      ),
    ).toBeNull()
    expect(resolveComponentAggregateSpec(comp('bar-chart', { categoryField: '月份' }))).toBeNull()
    expect(resolveComponentAggregateSpec(comp('text', {}))).toBeNull()
  })
})

describe('resolveComponentFieldMapping', () => {
  it('钻取图表返回下钻字段, 供 Widget 覆盖 groupBy', () => {
    expect(
      resolveComponentFieldMapping(
        comp('line-chart', {
          categoryField: '月份',
          valueFields: ['销售额'],
          drillFields: ['省份', '城市'],
        }),
      ),
    ).toMatchObject({
      groupBy: ['月份'],
      metrics: ['销售额'],
      drillFields: ['省份', '城市'],
    })
  })

  it('饼图同样携带下钻字段', () => {
    expect(
      resolveComponentFieldMapping(
        comp('pie-chart', { nameField: '渠道', valueField: '金额', drillFields: ['区域'] }),
      ),
    ).toMatchObject({ groupBy: ['渠道'], metrics: ['金额'], drillFields: ['区域'] })
  })

  it('无可聚合字段时返回 null', () => {
    expect(resolveComponentFieldMapping(comp('sankey-chart', { sourceField: '来源' }))).toBeNull()
    expect(resolveComponentFieldMapping(comp('text', {}))).toBeNull()
  })
})

describe('resolveComponentMetricMapping', () => {
  it('缺度量字段且非 count 时不可聚合', () => {
    expect(resolveComponentMetricMapping(comp('kpi-card', {}))).toBeNull()
    expect(resolveComponentMetricMapping(comp('stat-card', { valueField: '销售额' }))).toEqual({
      field: '销售额',
      aggregate: 'sum',
    })
  })

  it('count 允许空字段, 非法聚合返回 null', () => {
    expect(
      resolveComponentMetricMapping(comp('gauge', {}, { aggregate: 'count' })),
    ).toEqual({ field: undefined, aggregate: 'count' })
    expect(
      resolveComponentMetricMapping(comp('gauge', { valueField: '值' }, { aggregate: 'none' })),
    ).toBeNull()
  })
})

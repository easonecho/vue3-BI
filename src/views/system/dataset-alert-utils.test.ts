import { describe, it, expect } from 'vitest'
import {
  AGGREGATE_OPTIONS,
  CRON_OPTIONS,
  OPERATOR_OPTIONS,
  conditionLabel,
  formatAlertTime,
} from './dataset-alert-utils'

describe('conditionLabel 条件文案', () => {
  it('count 聚合不展示字段', () => {
    expect(
      conditionLabel({ field: null, aggregate: 'count', operator: 'gt', threshold: 100 }),
    ).toBe('行数 > 100')
  })

  it('非 count 聚合展示字段与操作符', () => {
    expect(
      conditionLabel({ field: 'amount', aggregate: 'sum', operator: 'gte', threshold: 0 }),
    ).toBe('求和(amount) >= 0')
    expect(
      conditionLabel({ field: 'score', aggregate: 'avg', operator: 'ne', threshold: 60 }),
    ).toBe('平均值(score) != 60')
  })

  it('未知聚合/操作符保留原始值', () => {
    expect(
      conditionLabel({
        field: null,
        aggregate: 'p95' as never,
        operator: 'between' as never,
        threshold: 5,
      }),
    ).toBe('p95 between 5')
  })
})

describe('formatAlertTime', () => {
  it('空值回退占位符', () => {
    expect(formatAlertTime(null)).toBe('-')
  })

  it('有效时间展示本地时间', () => {
    const text = formatAlertTime('2024-01-02T03:04:05.000Z')
    expect(text).not.toBe('-')
    expect(text).toContain('2024')
  })
})

describe('告警选项常量', () => {
  it('聚合/操作符/cron 选项完整', () => {
    expect(AGGREGATE_OPTIONS.map((item) => item.value)).toEqual([
      'count',
      'sum',
      'avg',
      'max',
      'min',
    ])
    expect(OPERATOR_OPTIONS).toHaveLength(6)
    expect(CRON_OPTIONS).toHaveLength(4)
    expect(CRON_OPTIONS[0].value).toBe('*/5 * * * *')
  })
})

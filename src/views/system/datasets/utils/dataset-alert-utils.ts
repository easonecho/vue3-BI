/**
 * 数据集告警 - 展示常量与纯函数
 */
import type { AlertAggregate, AlertOperator, AlertRule } from '@/api/alert'

export const AGGREGATE_OPTIONS: { label: string; value: AlertAggregate }[] = [
  { label: '行数 (count)', value: 'count' },
  { label: '求和 (sum)', value: 'sum' },
  { label: '平均值 (avg)', value: 'avg' },
  { label: '最大值 (max)', value: 'max' },
  { label: '最小值 (min)', value: 'min' },
]

export const OPERATOR_OPTIONS: { label: string; value: AlertOperator }[] = [
  { label: '大于 >', value: 'gt' },
  { label: '大于等于 >=', value: 'gte' },
  { label: '小于 <', value: 'lt' },
  { label: '小于等于 <=', value: 'lte' },
  { label: '等于 =', value: 'eq' },
  { label: '不等于 !=', value: 'ne' },
]

export const CRON_OPTIONS = [
  { label: '每 5 分钟', value: '*/5 * * * *' },
  { label: '每小时整点', value: '0 * * * *' },
  { label: '每天 09:00', value: '0 9 * * *' },
  { label: '每周一 09:00', value: '0 9 * * 1' },
]

const AGGREGATE_LABEL: Record<string, string> = {
  count: '行数',
  sum: '求和',
  avg: '平均值',
  max: '最大值',
  min: '最小值',
}

const OPERATOR_LABEL: Record<string, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '=',
  ne: '!=',
}

/** 规则条件文案，如「行数 > 100」 */
export function conditionLabel(
  row: Pick<AlertRule, 'field' | 'aggregate' | 'operator' | 'threshold'>,
): string {
  const field = row.field ? `(${row.field})` : ''
  return `${AGGREGATE_LABEL[row.aggregate] ?? row.aggregate}${field} ${
    OPERATOR_LABEL[row.operator] ?? row.operator
  } ${row.threshold}`
}

/** 告警时间格式化（空值回退 '-'） */
export function formatAlertTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

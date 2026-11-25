/**
 * 数据集告警 - 展示常量与纯函数
 */
import i18n from '@/i18n'
import type { AlertAggregate, AlertOperator, AlertRule } from '@/api/alert'
import { formatDateTime } from '@/utils/locale-format'

/** 选项文案随语言切换动态取词 */
function translate(key: string): string {
  return i18n.global.t(key)
}

export const AGGREGATE_OPTIONS: { label: string; value: AlertAggregate }[] = [
  {
    get label() {
      return translate('datasetPage.alerts.aggregate.count')
    },
    value: 'count',
  },
  {
    get label() {
      return translate('datasetPage.alerts.aggregate.sum')
    },
    value: 'sum',
  },
  {
    get label() {
      return translate('datasetPage.alerts.aggregate.avg')
    },
    value: 'avg',
  },
  {
    get label() {
      return translate('datasetPage.alerts.aggregate.max')
    },
    value: 'max',
  },
  {
    get label() {
      return translate('datasetPage.alerts.aggregate.min')
    },
    value: 'min',
  },
]

export const OPERATOR_OPTIONS: { label: string; value: AlertOperator }[] = [
  {
    get label() {
      return translate('datasetPage.alerts.operator.gt')
    },
    value: 'gt',
  },
  {
    get label() {
      return translate('datasetPage.alerts.operator.gte')
    },
    value: 'gte',
  },
  {
    get label() {
      return translate('datasetPage.alerts.operator.lt')
    },
    value: 'lt',
  },
  {
    get label() {
      return translate('datasetPage.alerts.operator.lte')
    },
    value: 'lte',
  },
  {
    get label() {
      return translate('datasetPage.alerts.operator.eq')
    },
    value: 'eq',
  },
  {
    get label() {
      return translate('datasetPage.alerts.operator.ne')
    },
    value: 'ne',
  },
]

export const CRON_OPTIONS = [
  {
    get label() {
      return translate('datasetPage.alerts.cron.every5Min')
    },
    value: '*/5 * * * *',
  },
  {
    get label() {
      return translate('datasetPage.alerts.cron.hourly')
    },
    value: '0 * * * *',
  },
  {
    get label() {
      return translate('datasetPage.alerts.cron.daily9')
    },
    value: '0 9 * * *',
  },
  {
    get label() {
      return translate('datasetPage.alerts.cron.weeklyMon9')
    },
    value: '0 9 * * 1',
  },
]

const AGGREGATE_KEY: Record<string, string> = {
  count: 'datasetPage.alerts.aggregateLabel.count',
  sum: 'datasetPage.alerts.aggregateLabel.sum',
  avg: 'datasetPage.alerts.aggregateLabel.avg',
  max: 'datasetPage.alerts.aggregateLabel.max',
  min: 'datasetPage.alerts.aggregateLabel.min',
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
  const aggregate = AGGREGATE_KEY[row.aggregate]
    ? translate(AGGREGATE_KEY[row.aggregate])
    : row.aggregate
  return `${aggregate}${field} ${OPERATOR_LABEL[row.operator] ?? row.operator} ${row.threshold}`
}

/** 告警时间格式化（空值回退 '-'） */
export function formatAlertTime(value: string | null): string {
  if (!value) return '-'
  return formatDateTime(value)
}

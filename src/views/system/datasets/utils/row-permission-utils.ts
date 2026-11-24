import i18n from '@/i18n'
import type {
  RowCondition,
  RowPermission,
  RowPermissionInput,
  RowPermissionOperator,
  RowPermissionOptions,
  RowSubjectType,
} from '@/api/dataset'

/** 选项文案随语言切换动态取词 */
function translate(key: string, named?: Record<string, unknown>): string {
  return named ? i18n.global.t(key, named) : i18n.global.t(key)
}

/** 操作符下拉选项 */
export const OPERATOR_OPTIONS: { label: string; value: RowPermissionOperator }[] = [
  {
    get label() {
      return translate('datasetPage.rowOperator.eq')
    },
    value: 'eq',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.ne')
    },
    value: 'ne',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.gt')
    },
    value: 'gt',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.gte')
    },
    value: 'gte',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.lt')
    },
    value: 'lt',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.lte')
    },
    value: 'lte',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.in')
    },
    value: 'in',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.notIn')
    },
    value: 'notIn',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.like')
    },
    value: 'like',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.isNull')
    },
    value: 'isNull',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.notNull')
    },
    value: 'notNull',
  },
  {
    get label() {
      return translate('datasetPage.rowOperator.between')
    },
    value: 'between',
  },
]

/** 操作符在条件展示文本中的符号 */
export const OPERATOR_LABELS: Record<RowPermissionOperator, string> = {
  eq: '=',
  ne: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  in: 'IN',
  notIn: 'NOT IN',
  like: 'LIKE',
  get isNull() {
    return translate('datasetPage.rowOperator.isNull')
  },
  get notNull() {
    return translate('datasetPage.rowOperator.notNull')
  },
  between: 'BETWEEN',
}

export function needsValue(op: RowPermissionOperator) {
  return op !== 'isNull' && op !== 'notNull'
}

/** 文本值转接口值: 数字保持数字, in/between 转数组 */
export function parseValue(op: RowPermissionOperator, text: string): unknown {
  if (!needsValue(op)) return undefined
  const raw = text.trim()
  if (op === 'in' || op === 'notIn' || op === 'between') {
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '')
      .map((v) => (/^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v))
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}

export interface EditableCondition {
  field: string
  operator: RowPermissionOperator
  valueText: string
}

export function createEmptyCondition(): EditableCondition {
  return { field: '', operator: 'eq', valueText: '' }
}

/** 将可编辑条件转换为接口条件（忽略未填字段名的行） */
export function buildConditions(conditions: EditableCondition[]): RowCondition[] {
  return conditions
    .filter((c) => c.field.trim() !== '')
    .map((c) => ({
      field: c.field.trim(),
      operator: c.operator,
      value: parseValue(c.operator, c.valueText),
    }))
}

/** 规则适用对象展示文案 */
export function subjectLabel(rule: RowPermission, options: RowPermissionOptions): string {
  if (rule.subjectType === 'all') return translate('datasetPage.subject.all')
  if (rule.subjectType === 'role') {
    const item = options.roles.find((r) => r.id === rule.subjectId)
    return translate('datasetPage.subject.role', { name: item?.name ?? `#${rule.subjectId}` })
  }
  if (rule.subjectType === 'user') {
    const item = options.users.find((u) => u.id === rule.subjectId)
    const name = item ? item.nickname || item.username : `#${rule.subjectId}`
    return translate('datasetPage.subject.user', { name })
  }
  const item = options.departments.find((d) => d.id === rule.subjectId)
  return translate('datasetPage.subject.dept', { name: item?.name ?? `#${rule.subjectId}` })
}

/** 规则过滤条件展示文案（多条件 AND） */
export function conditionsLabel(rule: RowPermission): string {
  return (rule.conditions || [])
    .map((c) => {
      if (c.operator === 'isNull' || c.operator === 'notNull') {
        return `${c.field} ${OPERATOR_LABELS[c.operator]}`
      }
      const value = Array.isArray(c.value) ? c.value.join(',') : String(c.value ?? '')
      return `${c.field} ${OPERATOR_LABELS[c.operator] ?? c.operator} ${value}`
    })
    .join(' AND ')
}

/** 根据适用对象类型生成选择器选项 */
export function buildSubjectOptions(
  type: RowSubjectType,
  options: RowPermissionOptions,
): { label: string; value: number }[] {
  if (type === 'role') {
    return options.roles.map((r) => ({
      label: `${r.name} (${r.code})`,
      value: r.id,
    }))
  }
  if (type === 'user') {
    return options.users.map((u) => ({
      label: u.nickname ? `${u.nickname} (${u.username})` : u.username,
      value: u.id,
    }))
  }
  if (type === 'dept') {
    return options.departments.map((d) => ({ label: d.name, value: d.id }))
  }
  return []
}

export interface RowPermissionFormState {
  name: string
  subjectType: RowSubjectType
  subjectId?: number
  conditions: EditableCondition[]
  priority: number
  enabled: boolean
}

export function createEmptyForm(): RowPermissionFormState {
  return {
    name: '',
    subjectType: 'all',
    subjectId: undefined,
    conditions: [createEmptyCondition()],
    priority: 0,
    enabled: true,
  }
}

/** 将已有规则转换为表单可编辑状态 */
export function ruleToForm(rule: RowPermission): RowPermissionFormState {
  const conditions = (rule.conditions || []).map((c) => ({
    field: c.field,
    operator: c.operator,
    valueText: Array.isArray(c.value)
      ? c.value.join(',')
      : c.value === null || c.value === undefined
        ? ''
        : String(c.value),
  }))
  return {
    name: rule.name,
    subjectType: rule.subjectType,
    subjectId: rule.subjectId ?? undefined,
    conditions: conditions.length > 0 ? conditions : [createEmptyCondition()],
    priority: rule.priority ?? 0,
    enabled: rule.enabled !== false,
  }
}

/** 表单 → 接口入参 */
export function formToPayload(form: RowPermissionFormState): RowPermissionInput {
  return {
    name: form.name.trim(),
    subjectType: form.subjectType,
    subjectId: form.subjectType === 'all' ? null : form.subjectId,
    conditions: buildConditions(form.conditions),
    priority: form.priority,
    enabled: form.enabled,
  }
}

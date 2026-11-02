import type {
  RowCondition,
  RowPermission,
  RowPermissionInput,
  RowPermissionOperator,
  RowPermissionOptions,
  RowSubjectType,
} from '@/api/dataset'

/** 操作符下拉选项 */
export const OPERATOR_OPTIONS: { label: string; value: RowPermissionOperator }[] = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '包含于 (in)', value: 'in' },
  { label: '不包含于 (notIn)', value: 'notIn' },
  { label: '模糊匹配', value: 'like' },
  { label: '为空', value: 'isNull' },
  { label: '不为空', value: 'notNull' },
  { label: '区间 (between)', value: 'between' },
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
  isNull: '为空',
  notNull: '不为空',
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
  if (rule.subjectType === 'all') return '全员'
  if (rule.subjectType === 'role') {
    const item = options.roles.find((r) => r.id === rule.subjectId)
    return `角色: ${item?.name ?? `#${rule.subjectId}`}`
  }
  if (rule.subjectType === 'user') {
    const item = options.users.find((u) => u.id === rule.subjectId)
    const name = item ? item.nickname || item.username : `#${rule.subjectId}`
    return `用户: ${name}`
  }
  const item = options.departments.find((d) => d.id === rule.subjectId)
  return `部门: ${item?.name ?? `#${rule.subjectId}`}`
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

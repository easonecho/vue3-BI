import { describe, it, expect } from 'vitest'
import type { RowPermission, RowPermissionOptions } from '@/api/dataset'
import {
  buildConditions,
  buildSubjectOptions,
  conditionsLabel,
  createEmptyForm,
  formToPayload,
  needsValue,
  parseValue,
  ruleToForm,
  subjectLabel,
} from './row-permission-utils'

const options: RowPermissionOptions = {
  roles: [{ id: 1, name: '管理员', code: 'ADMIN' }],
  users: [{ id: 2, username: 'alice', nickname: '小爱' }],
  departments: [{ id: 3, name: '华东大区' }],
}

const rule: RowPermission = {
  id: 10,
  datasetId: 1,
  name: '本区数据',
  subjectType: 'dept',
  subjectId: 3,
  conditions: [
    { field: 'region', operator: 'eq', value: '华东' },
    { field: 'deletedAt', operator: 'isNull' },
  ],
  enabled: true,
  priority: 5,
}

describe('parseValue', () => {
  it('数字保持数字，字符串保持字符串', () => {
    expect(parseValue('eq', ' 42 ')).toBe(42)
    expect(parseValue('like', ' 华东 ')).toBe('华东')
  })

  it('in / between 转为数组并忽略空项', () => {
    expect(parseValue('in', '1, 2, ,abc')).toEqual([1, 2, 'abc'])
    expect(parseValue('between', '10,20')).toEqual([10, 20])
  })

  it('isNull / notNull 无需值', () => {
    expect(needsValue('isNull')).toBe(false)
    expect(parseValue('isNull', 'ignored')).toBeUndefined()
  })
})

describe('buildConditions', () => {
  it('忽略字段名为空的行，并 trim 字段名', () => {
    expect(
      buildConditions([
        { field: ' region ', operator: 'eq', valueText: '华东' },
        { field: '   ', operator: 'eq', valueText: 'x' },
      ]),
    ).toEqual([{ field: 'region', operator: 'eq', value: '华东' }])
  })
})

describe('展示文案', () => {
  it('subjectLabel 按对象类型解析名称', () => {
    expect(subjectLabel({ ...rule, subjectType: 'all' }, options)).toBe('全员')
    expect(subjectLabel({ ...rule, subjectType: 'role', subjectId: 1 }, options)).toBe(
      '角色: 管理员',
    )
    expect(subjectLabel({ ...rule, subjectType: 'user', subjectId: 2 }, options)).toBe(
      '用户: 小爱',
    )
    expect(subjectLabel(rule, options)).toBe('部门: 华东大区')
    expect(subjectLabel({ ...rule, subjectType: 'role', subjectId: 99 }, options)).toBe(
      '角色: #99',
    )
  })

  it('conditionsLabel 用 AND 连接，空值操作符不带值', () => {
    expect(conditionsLabel(rule)).toBe('region = 华东 AND deletedAt 为空')
  })
})

describe('表单与接口转换', () => {
  it('ruleToForm / formToPayload 往返保持字段', () => {
    const form = ruleToForm(rule)
    expect(form.conditions).toHaveLength(2)
    expect(form.conditions[0].valueText).toBe('华东')
    expect(formToPayload(form)).toEqual({
      name: '本区数据',
      subjectType: 'dept',
      subjectId: 3,
      conditions: rule.conditions,
      priority: 5,
      enabled: true,
    })
  })

  it('全员规则提交 subjectId=null，空条件表单得到空数组', () => {
    const form = createEmptyForm()
    form.name = '全员可见'
    expect(formToPayload(form)).toMatchObject({
      name: '全员可见',
      subjectType: 'all',
      subjectId: null,
      conditions: [],
    })
  })

  it('buildSubjectOptions 按类型生成可选项', () => {
    expect(buildSubjectOptions('role', options)).toEqual([{ label: '管理员 (ADMIN)', value: 1 }])
    expect(buildSubjectOptions('user', options)).toEqual([{ label: '小爱 (alice)', value: 2 }])
    expect(buildSubjectOptions('dept', options)).toEqual([{ label: '华东大区', value: 3 }])
    expect(buildSubjectOptions('all', options)).toEqual([])
  })
})

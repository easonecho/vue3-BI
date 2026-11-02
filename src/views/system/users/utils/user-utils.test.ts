import { describe, it, expect } from 'vitest'
import type { FormRules } from 'element-plus'
import { buildPasswordRules, roleTagType } from './user-utils'

describe('roleTagType', () => {
  it('按角色编码映射标签类型', () => {
    expect(roleTagType('ADMIN')).toBe('danger')
    expect(roleTagType('viewer')).toBe('info')
    expect(roleTagType('EDITOR')).toBe('success')
    expect(roleTagType(undefined)).toBe('info')
  })
})

describe('buildPasswordRules', () => {
  const rules = buildPasswordRules(() => 'secret1') as Record<
    string,
    { validator?: (rule: unknown, value: string, cb: (err?: Error) => void) => void }[]
  >

  it('确认密码一致时通过', () => {
    const validator = rules.confirmPassword[1].validator!
    let error: Error | undefined
    validator({}, 'secret1', (err) => {
      error = err
    })
    expect(error).toBeUndefined()
  })

  it('确认密码不一致时报错', () => {
    const validator = rules.confirmPassword[1].validator!
    let error: Error | undefined
    validator({}, 'other', (err) => {
      error = err
    })
    expect(error?.message).toBe('两次输入的新密码不一致')
  })

  it('新密码长度受 6-50 限制', () => {
    const minRule = (buildPasswordRules(() => '') as FormRules).password as {
      min?: number
      max?: number
    }[]
    expect(minRule[1].min).toBe(6)
    expect(minRule[1].max).toBe(50)
  })
})

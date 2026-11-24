import type { FormRules } from 'element-plus'
import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 用户角色标签类型：ADMIN 红色、VIEWER 灰色、其余绿色 */
export function roleTagType(code?: string): 'info' | 'danger' | 'success' {
  if (!code) return 'info'
  if (code.toUpperCase().includes('ADMIN')) return 'danger'
  if (code.toUpperCase().includes('VIEWER')) return 'info'
  return 'success'
}

/** 新增/编辑用户表单校验规则 */
export function buildUserFormRules(): FormRules {
  return {
    username: [
      { required: true, message: t('userPage.usernameRequired'), trigger: 'blur' },
      { min: 2, max: 50, message: t('userPage.usernameLength'), trigger: 'blur' },
    ],
    password: [
      { required: true, message: t('userPage.passwordRequired'), trigger: 'blur' },
      { min: 6, max: 50, message: t('userPage.passwordLength'), trigger: 'blur' },
    ],
    roleId: [{ required: true, message: t('userPage.roleRequired'), trigger: 'change' }],
    email: [{ type: 'email', message: t('userPage.emailInvalid'), trigger: 'blur' }],
    status: [{ required: true, message: t('userPage.statusRequired'), trigger: 'change' }],
  }
}

/** 重置密码校验规则：确认密码需与新密码一致 */
export function buildPasswordRules(getPassword: () => string): FormRules {
  return {
    password: [
      { required: true, message: t('userPage.newPasswordRequired'), trigger: 'blur' },
      { min: 6, max: 50, message: t('userPage.passwordLength'), trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: t('userPage.confirmPasswordRequired'), trigger: 'blur' },
      {
        trigger: 'blur',
        validator: (_rule: unknown, value: string, cb: (err?: Error) => void) => {
          if (value !== getPassword()) cb(new Error(t('userPage.passwordMismatch')))
          else cb()
        },
      },
    ],
  }
}

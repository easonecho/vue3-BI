import type { FormRules } from 'element-plus'

/** 用户角色标签类型：ADMIN 红色、VIEWER 灰色、其余绿色 */
export function roleTagType(code?: string): 'info' | 'danger' | 'success' {
  if (!code) return 'info'
  if (code.toUpperCase().includes('ADMIN')) return 'danger'
  if (code.toUpperCase().includes('VIEWER')) return 'info'
  return 'success'
}

/** 新增/编辑用户表单校验规则 */
export const userFormRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度 2-50', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '长度 6-50', trigger: 'blur' },
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

/** 重置密码校验规则：确认密码需与新密码一致 */
export function buildPasswordRules(getPassword: () => string): FormRules {
  return {
    password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 50, message: '长度 6-50', trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        trigger: 'blur',
        validator: (_rule: unknown, value: string, cb: (err?: Error) => void) => {
          if (value !== getPassword()) cb(new Error('两次输入的新密码不一致'))
          else cb()
        },
      },
    ],
  }
}

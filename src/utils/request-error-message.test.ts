import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { localizedErrorMessage } from './request'

afterEach(() => {
  i18n.global.locale.value = 'zh-CN'
})

describe('业务错误文案本地化', () => {
  it('中文环境保留后端原文（含动态细节）', () => {
    i18n.global.locale.value = 'zh-CN'
    expect(localizedErrorMessage(20003, '用户名或密码错误')).toBe('用户名或密码错误')
    expect(localizedErrorMessage(10001, '参数 page 必须大于 0')).toBe('参数 page 必须大于 0')
  })

  it('中文环境后端无文案时用错误码兜底', () => {
    i18n.global.locale.value = 'zh-CN'
    expect(localizedErrorMessage(50004, '')).toBe('分享链接已过期')
  })

  it('英文环境使用错误码映射', () => {
    i18n.global.locale.value = 'en-US'
    expect(localizedErrorMessage(20003, '用户名或密码错误')).toBe('Incorrect username or password')
  })

  it('英文环境未收录错误码时回退后端原文', () => {
    i18n.global.locale.value = 'en-US'
    expect(localizedErrorMessage(99999, '自定义错误')).toBe('自定义错误')
  })
})

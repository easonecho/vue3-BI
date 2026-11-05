import { describe, expect, it } from 'vitest'
import {
  buildVitalsPayload,
  createErrorThrottle,
  extractErrorInfo,
} from './observability'

describe('extractErrorInfo', () => {
  it('提取 Error 的 message/stack', () => {
    const error = new Error('boom')
    expect(extractErrorInfo(error)).toEqual({ message: 'boom', stack: error.stack })
  })

  it('处理字符串与普通对象', () => {
    expect(extractErrorInfo('boom')).toEqual({ message: 'boom' })
    expect(extractErrorInfo({ message: 'boom', stack: 'trace' })).toEqual({
      message: 'boom',
      stack: 'trace',
    })
    expect(extractErrorInfo({ code: 500 })).toEqual({ message: '{"code":500}' })
  })

  it('截断超长内容并兜底循环引用', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(extractErrorInfo(circular).message).toBe('Unknown error')
    expect(extractErrorInfo('x'.repeat(1000)).message.length).toBe(500)
  })
})

describe('createErrorThrottle', () => {
  it('同 key 在窗口内去重, 窗口后放行', () => {
    let now = 0
    const shouldReport = createErrorThrottle({ windowMs: 1000, now: () => now })
    expect(shouldReport('window-error:boom')).toBe(true)
    expect(shouldReport('window-error:boom')).toBe(false)
    now = 1001
    expect(shouldReport('window-error:boom')).toBe(true)
  })

  it('不同 key 互不影响, 总量封顶', () => {
    let now = 0
    const shouldReport = createErrorThrottle({ maxErrors: 2, windowMs: 1000, now: () => now })
    expect(shouldReport('a')).toBe(true)
    expect(shouldReport('b')).toBe(true)
    expect(shouldReport('c')).toBe(false)
    now = 5000
    expect(shouldReport('c')).toBe(false)
  })
})

describe('buildVitalsPayload', () => {
  it('取整毫秒并保留 CLS 小数', () => {
    const payload = buildVitalsPayload('/dashboard', {
      lcpMs: 1234.6,
      fcpMs: 800.2,
      ttfbMs: 130.8,
      cls: 0.123456,
    })
    expect(payload).toEqual({
      kind: 'vitals',
      route: '/dashboard',
      lcpMs: 1235,
      fcpMs: 800,
      ttfbMs: 131,
      cls: 0.1235,
    })
  })

  it('丢弃非法/非正指标并截断 route', () => {
    const payload = buildVitalsPayload(`/${'a'.repeat(300)}`, {
      lcpMs: Number.NaN,
      fcpMs: -1,
      ttfbMs: 0,
      cls: Number.POSITIVE_INFINITY,
    })
    expect(payload.lcpMs).toBeUndefined()
    expect(payload.fcpMs).toBeUndefined()
    expect(payload.ttfbMs).toBeUndefined()
    expect(payload.cls).toBeUndefined()
    expect(payload.route.length).toBe(200)
  })
})

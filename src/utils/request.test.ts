import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { instance, messageMock, progressMock } = vi.hoisted(() => {
  // axios 实例本身可调用 (request(config)), 与 instance.request 等价
  const instanceFn = vi.fn<(config: { headers: Record<string, string> }) => Promise<unknown>>()
  const instance = Object.assign(instanceFn, {
    get: vi.fn(),
    post: vi.fn<(url: string, data?: unknown, config?: unknown) => Promise<unknown>>(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: instanceFn,
    interceptors: {
      request: { use: vi.fn<(onFulfilled: unknown, onRejected?: unknown) => void>() },
      response: { use: vi.fn<(onFulfilled: unknown, onRejected?: unknown) => void>() },
    },
  })
  return {
    instance,
    messageMock: { error: vi.fn() },
    progressMock: { startProgress: vi.fn(), doneProgress: vi.fn() },
  }
})

vi.mock('axios', () => ({
  default: {
    create: () => instance,
    isCancel: () => false,
  },
}))

vi.mock('element-plus', () => ({ ElMessage: messageMock }))

vi.mock('@/utils/progress', () => progressMock)

// 本文件只验证刷新队列逻辑, 语言包替换为 key 直出, 避免加载真实 i18n 拖慢用例
vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
      te: () => false,
      locale: { value: 'zh-CN' },
    },
  },
}))

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason?: unknown) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** 构造 401 错误对象 (request 拦截器只关心 config/response) */
function unauthorized(url: string) {
  return {
    config: { url, method: 'get', headers: {} as Record<string, string> },
    response: { status: 401 },
  }
}

type RejectHandler = (error: unknown) => Promise<unknown>

/** 每个用例重新加载模块, 重置 isRefreshing / refreshQueue / token 等模块级状态 */
async function loadRejectHandler(): Promise<RejectHandler> {
  vi.resetModules()
  await import('./request')
  const calls = instance.interceptors.response.use.mock.calls
  const last = calls[calls.length - 1]
  return last?.[1] as RejectHandler
}

beforeEach(() => {
  vi.resetAllMocks()
  document.cookie = 'bi_csrf=test-csrf; path=/'
})

afterEach(() => {
  document.cookie = 'bi_csrf=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

describe('request 401 静默刷新', () => {
  it('刷新成功后重放排队请求并携带新 token', async () => {
    const refresh = deferred<{ code: number; data: { accessToken: string } }>()
    instance.post.mockReturnValue(refresh.promise)
    instance.request.mockResolvedValue({ code: 0, data: 'ok' })

    const onRejected = await loadRejectHandler()

    // 首个 401 触发刷新并挂起
    const first = onRejected(unauthorized('/api/a'))
    // 刷新进行中到达的第二个 401 进入排队
    const second = onRejected(unauthorized('/api/b'))

    expect(instance.post.mock.calls[0][0]).toBe('/api/auth/refresh')

    refresh.resolve({ code: 0, data: { accessToken: 'new-token' } })

    await expect(first).resolves.toEqual({ code: 0, data: 'ok' })
    await expect(second).resolves.toEqual({ code: 0, data: 'ok' })
    // 两个请求都用新 token 重放
    expect(instance.request).toHaveBeenCalledTimes(2)
    expect(instance.request.mock.calls[0][0].headers.Authorization).toBe('Bearer new-token')
    expect(instance.request.mock.calls[1][0].headers.Authorization).toBe('Bearer new-token')
  })

  it('刷新失败时拒绝排队请求，避免 Promise 永久挂起', async () => {
    const refresh = deferred<{ code: number; data: { accessToken: string } }>()
    instance.post.mockReturnValue(refresh.promise)

    const onRejected = await loadRejectHandler()

    const firstError = unauthorized('/api/a')
    const first = onRejected(firstError)
    const second = onRejected(unauthorized('/api/b'))

    // 先挂载 reject 处理再触发失败, 避免测试期间出现 unhandled rejection
    const firstResult = first.then(
      () => 'resolved',
      (reason: unknown) => reason,
    )
    const secondResult = second.then(
      () => 'resolved',
      (reason: unknown) => reason,
    )

    refresh.reject(new Error('refresh failed'))

    expect(await firstResult).toMatchObject({ response: { status: 401 } })
    expect(await secondResult).toMatchObject({ response: { status: 401 } })
    // 刷新失败不应重放任何请求
    expect(instance.request).not.toHaveBeenCalled()
  })

  it('业务错误 reject 时携带错误码', async () => {
    vi.resetModules()
    await import('./request')
    const calls = instance.interceptors.response.use.mock.calls
    const onFulfilled = calls[calls.length - 1]?.[0] as (response: unknown) => unknown

    const result = onFulfilled({
      config: { url: '/api/share/x', headers: {} },
      data: { code: 50004, message: '分享链接已过期' },
    })

    await expect(result).rejects.toMatchObject({ message: '分享链接已过期', code: 50004 })
  })

  it('刷新失败复位刷新状态，下一次 401 会重新发起刷新', async () => {
    instance.post.mockRejectedValueOnce(new Error('refresh failed'))
    instance.request.mockResolvedValue({ code: 0, data: 'ok' })

    const onRejected = await loadRejectHandler()

    await expect(onRejected(unauthorized('/api/a'))).rejects.toBeDefined()

    instance.post.mockResolvedValueOnce({ code: 0, data: { accessToken: 'token-2' } })
    await expect(onRejected(unauthorized('/api/b'))).resolves.toEqual({ code: 0, data: 'ok' })

    expect(instance.post).toHaveBeenCalledTimes(2)
    expect(instance.request).toHaveBeenCalledTimes(1)
  })
})

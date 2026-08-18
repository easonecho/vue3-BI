/**
 * ============================================================================
 * BI 低代码平台 - Axios 请求封装
 * ============================================================================
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'

/** 服务端统一响应结构 */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页响应数据 */
export interface PaginateData<T = unknown> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const TOKEN_KEY = 'bi_token'
const REFRESH_KEY = 'bi_refresh_token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}
export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_KEY) || ''
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token)
}
export function setTokenPair(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// ========== NProgress 配置 ==========
NProgress.configure({ showSpinner: false, trickleSpeed: 200 })

// ========== TraceId 生成 ==========
/** 生成 UUID v4 格式的 traceId */
function generateTraceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ========== 重复请求取消 (AbortController) ==========
const pendingMap = new Map<string, AbortController>()

/** 根据请求配置生成唯一 key */
function getRequestKey(config: AxiosRequestConfig): string {
  const { method = 'get', url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

/** 添加请求到 pending 队列，若已存在相同请求则取消前一个 */
function addPending(config: AxiosRequestConfig): void {
  const key = getRequestKey(config)
  if (pendingMap.has(key)) {
    pendingMap.get(key)?.abort()
    pendingMap.delete(key)
  }
  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, controller)
}

/** 从 pending 队列中移除已完成的请求 */
function removePending(config: AxiosRequestConfig): void {
  const key = getRequestKey(config)
  if (pendingMap.has(key)) {
    pendingMap.delete(key)
  }
}

/**
 * access token 静默刷新并发锁:
 * - 多个并发请求同时遇到 401 时, 只发起一次 refresh;
 * - 其余请求等 promise 结束后重试, 避免多发刷新导致服务端错乱。
 */
let isRefreshing = false
let refreshQueue: Array<() => void> = []

async function handleTokenRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) {
    return false
  }
  try {
    // 动态 import 避免循环依赖 (request.ts -> auth.ts -> request.ts)
    const { refreshToken: refreshApi } = await import('@/api/auth')
    const res = await refreshApi({ refreshToken: refresh })
    if (res.code === 0 && res.data) {
      setTokenPair(res.data.accessToken, res.data.refreshToken)
      refreshQueue.forEach((fn) => fn())
      refreshQueue = []
      return true
    }
    return false
  } catch {
    return false
  } finally {
    isRefreshing = false
  }
}

const request: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

request.interceptors.request.use(
  (config) => {
    // 启动进度条
    NProgress.start()

    // 生成并注入 traceId
    config.headers['X-Trace-Id'] = generateTraceId()

    // 携带 token
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 重复请求取消
    addPending(config)

    return config
  },
  (error) => {
    NProgress.done()
    return Promise.reject(error)
  },
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResult>) => {
    removePending(response.config)
    NProgress.done()

    const res = response.data
    if (response.config.responseType === 'blob') {
      return response as unknown as AxiosResponse<ApiResult>
    }
    if (res.code === 0) {
      return res as unknown as AxiosResponse<ApiResult>
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  async (error) => {
    // 取消的请求不提示错误
    if (axios.isCancel(error)) {
      NProgress.done()
      return Promise.reject(error)
    }

    if (error.config) {
      removePending(error.config)
    }
    NProgress.done()

    const { response } = error
    if (response) {
      switch (response.status) {
        case 401: {
          const originalConfig = error.config
          // 防重复刷新死循环: 已重试过一次则放弃
          const alreadyRetried = (originalConfig as any).__retried
          const hasRefresh = !!getRefreshToken()

          if (hasRefresh && !alreadyRetried) {
            if (!isRefreshing) {
              isRefreshing = true
              ;(originalConfig as any).__retried = true
              const ok = await handleTokenRefresh()
              if (ok) {
                // 用新 access token 重放原请求
                originalConfig.headers.Authorization = `Bearer ${getToken()}`
                return request(originalConfig)
              }
            } else {
              // 已有刷新在进行: 排队等它完成后再重放
              ;(originalConfig as any).__retried = true
              return new Promise<void>((resolve) => {
                refreshQueue.push(() => {
                  originalConfig.headers.Authorization = `Bearer ${getToken()}`
                  resolve(request(originalConfig) as any)
                })
              }) as any
            }
          }
          // refresh 失败或无 refresh token: 走登出流程
          ElMessage.error('登录已过期，请重新登录')
          removeToken()
          // 避免 pinia 循环依赖, 用事件通知应用层跳转登录页
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('bi-auth:expired'))
          }
          break
        }
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(response.data?.message || `请求错误 (${response.status})`)
      }
    } else if (error.message?.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络')
    } else {
      ElMessage.error('网络异常，请检查网络连接')
    }
    return Promise.reject(error)
  },
)

export function get<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
  return request.get(url, { params, ...config }) as unknown as Promise<ApiResult<T>>
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
  return request.post(url, data, config) as unknown as Promise<ApiResult<T>>
}

export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
  return request.put(url, data, config) as unknown as Promise<ApiResult<T>>
}

export function del<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
  return request.delete(url, { params, ...config }) as unknown as Promise<ApiResult<T>>
}

export function download(url: string, data?: unknown): Promise<Blob> {
  return request.post(url, data, { responseType: 'blob' }).then((res) => (res as unknown as AxiosResponse).data as Blob)
}

export default request

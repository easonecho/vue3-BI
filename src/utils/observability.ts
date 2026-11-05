/**
 * ============================================================================
 * 前端可观测性: 异常上报 + Web Vitals
 * ============================================================================
 * - 捕获 window error / unhandledrejection / Vue errorHandler 异常
 * - 在页面隐藏时上报 LCP / CLS / FCP / TTFB
 * - 单会话最多上报 20 条异常, 同 key 60 秒去重, 避免错误风暴打爆后端
 * - 上报失败静默忽略, 不影响业务
 * ============================================================================
 */
export type ClientErrorSource = 'window-error' | 'unhandledrejection' | 'vue-error'

export interface ClientErrorPayload {
  kind: 'error'
  source: ClientErrorSource
  level: 'error' | 'warning'
  message: string
  stack?: string
  route?: string
}

export interface ClientVitalsPayload {
  kind: 'vitals'
  route: string
  lcpMs?: number
  fcpMs?: number
  ttfbMs?: number
  cls?: number
}

const ENDPOINT = '/api/client-metrics'
const MAX_MESSAGE = 500
const MAX_STACK = 3000
const MAX_ROUTE = 200
const MAX_ERRORS_PER_SESSION = 20
const DEDUPE_WINDOW_MS = 60_000

export function truncateText(value: string, maxLength: number): string {
  return value.slice(0, maxLength)
}

/** 把任意异常/拒绝值转换为可上报的 message + stack */
export function extractErrorInfo(value: unknown): { message: string; stack?: string } {
  if (value instanceof Error) {
    return {
      message: truncateText(value.message || value.name || 'Unknown error', MAX_MESSAGE),
      stack: value.stack ? truncateText(value.stack, MAX_STACK) : undefined,
    }
  }
  if (typeof value === 'string') {
    return { message: truncateText(value || 'Unknown error', MAX_MESSAGE) }
  }
  if (value && typeof value === 'object') {
    const record = value as { message?: unknown; stack?: unknown }
    const message =
      typeof record.message === 'string' && record.message
        ? record.message
        : safeJsonStringify(value)
    const stack = typeof record.stack === 'string' ? record.stack : undefined
    return {
      message: truncateText(message || 'Unknown error', MAX_MESSAGE),
      stack: stack ? truncateText(stack, MAX_STACK) : undefined,
    }
  }
  return { message: truncateText(String(value ?? 'Unknown error'), MAX_MESSAGE) }
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? ''
  } catch {
    return ''
  }
}

export interface ErrorThrottleOptions {
  maxErrors?: number
  windowMs?: number
  now?: () => number
}

/** 会话级异常采样: 总量上限 + 相同 key 时间窗口去重 */
export function createErrorThrottle(options: ErrorThrottleOptions = {}) {
  const maxErrors = options.maxErrors ?? MAX_ERRORS_PER_SESSION
  const windowMs = options.windowMs ?? DEDUPE_WINDOW_MS
  const now = options.now ?? Date.now
  const lastSeen = new Map<string, number>()
  let total = 0

  return function shouldReport(key: string): boolean {
    if (total >= maxErrors) return false
    const timestamp = now()
    const last = lastSeen.get(key)
    if (last !== undefined && timestamp - last < windowMs) return false
    lastSeen.set(key, timestamp)
    total += 1
    return true
  }
}

function roundMetric(value: number, digits = 0): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** 构造 Web Vitals 上报体: 丢弃非法值, LCP/FCP/TTFB 取整毫秒, CLS 保留 4 位小数 */
export function buildVitalsPayload(
  route: string,
  values: { lcpMs?: number; fcpMs?: number; ttfbMs?: number; cls?: number },
): ClientVitalsPayload {
  const payload: ClientVitalsPayload = {
    kind: 'vitals',
    route: truncateText(route, MAX_ROUTE),
  }
  if (Number.isFinite(values.lcpMs) && (values.lcpMs as number) > 0) {
    payload.lcpMs = roundMetric(values.lcpMs as number)
  }
  if (Number.isFinite(values.fcpMs) && (values.fcpMs as number) > 0) {
    payload.fcpMs = roundMetric(values.fcpMs as number)
  }
  if (Number.isFinite(values.ttfbMs) && (values.ttfbMs as number) > 0) {
    payload.ttfbMs = roundMetric(values.ttfbMs as number)
  }
  if (Number.isFinite(values.cls) && (values.cls as number) > 0) {
    payload.cls = roundMetric(values.cls as number, 4)
  }
  return payload
}

function currentRoute(): string {
  if (typeof window === 'undefined') return ''
  return truncateText(window.location.pathname, MAX_ROUTE)
}

function sendPayload(
  payload: ClientErrorPayload | ClientVitalsPayload,
  preferBeacon = false,
): void {
  if (typeof window === 'undefined') return
  const body = JSON.stringify(payload)
  if (preferBeacon && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    return
  }
  if (typeof fetch !== 'function') return
  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // 上报失败静默忽略
  })
}

const shouldReportError = createErrorThrottle()

/** 上报单条异常 (window / unhandledrejection / vue errorHandler 共用) */
export function reportClientError(
  error: unknown,
  source: ClientErrorSource,
  context?: string,
): void {
  const info = extractErrorInfo(error)
  if (!shouldReportError(`${source}:${info.message}`)) return
  const stack = context
    ? truncateText(`${info.stack ?? ''}\n[vue] ${context}`.trim(), MAX_STACK)
    : info.stack
  sendPayload({
    kind: 'error',
    source,
    level: 'error',
    message: info.message,
    stack,
    route: currentRoute(),
  })
}

interface VitalsState {
  lcpMs?: number
  cls?: number
}

/** 监听 LCP / CLS (不支持的环境自动跳过) */
function observeVitals(): () => VitalsState {
  let lcpMs = 0
  let cls = 0
  const observers: PerformanceObserver[] = []
  try {
    if (typeof PerformanceObserver !== 'undefined') {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) lcpMs = entry.startTime
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      observers.push(lcpObserver)

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { value: number; hadRecentInput: boolean }
        >) {
          if (!entry.hadRecentInput) cls += entry.value
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      observers.push(clsObserver)
    }
  } catch {
    // 忽略不支持该指标类型的浏览器
  }
  return () => {
    // 主动断开, 避免 observer 泄漏
    observers.forEach((observer) => observer.disconnect())
    return { lcpMs: lcpMs || undefined, cls: cls || undefined }
  }
}

let installed = false

/** 安装全局可观测性监听 (幂等, main.ts 调用一次) */
export function installClientObservability(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.addEventListener('error', (event) => {
    reportClientError(event.error ?? event.message, 'window-error')
  })
  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason, 'unhandledrejection')
  })

  const readVitals = observeVitals()
  let vitalsSent = false
  const reportVitals = () => {
    if (vitalsSent) return
    vitalsSent = true
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    const fcp = performance
      .getEntriesByType('paint')
      .find((entry) => entry.name === 'first-contentful-paint')
    const vitals = readVitals()
    sendPayload(
      buildVitalsPayload(currentRoute(), {
        ...vitals,
        fcpMs: fcp?.startTime,
        ttfbMs: nav?.responseStart,
      }),
      true,
    )
  }

  window.addEventListener('pagehide', reportVitals)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportVitals()
  })
}

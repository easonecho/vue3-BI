/**
 * 全局顶部进度条（NProgress）并发计数
 *
 * 路由切换与接口请求共用同一个计数：只有所有进行中的任务都结束时才收起进度条，
 * 避免并发请求下某个请求先返回就把进度条提前关掉。
 */
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 200 })

let activeCount = 0

/** 开始一个任务；首个任务启动进度条 */
export function startProgress(): void {
  activeCount += 1
  if (activeCount === 1) NProgress.start()
}

/** 结束一个任务；最后一个任务结束时收起进度条 */
export function doneProgress(): void {
  if (activeCount === 0) return
  activeCount -= 1
  if (activeCount === 0) NProgress.done()
}

/** 强制结束并清零（路由异常等无法配对收尾时兜底） */
export function resetProgress(): void {
  if (activeCount > 0) NProgress.done()
  activeCount = 0
}

/**
 * ============================================================================
 * 看板首屏批量取数调度器
 * ============================================================================
 * 问题:
 *   看板首屏 10~20 个图表，各自调用 /datasets/:id/execute 或 /query，
 *   会产生 20 次 HTTP + 20 次鉴权/租户/元数据查询，且浏览器并发受限。
 *
 * 方案:
 *   - 同一帧内（24ms 合并窗口）到达的取数请求合并为一次 /datasets/batch-query
 *   - 相同 datasetId + 参数 + 查询条件的请求自动去重（多个图表绑定同一数据集）
 *   - 单批最多 20 项，超过上限自动分片
 *   - 整个批量接口不可用（旧版后端 404 / 网络异常）时自动回退到单请求
 *   - 单项失败只 reject 对应调用，不影响同批其它图表
 *
 * 仅用于登录态；公开分享仍走原有单请求接口（匿名接口签名不同）。
 * ============================================================================
 */

import {
  executeDataset,
  queryDataset,
  fetchDatasetPage,
  fetchDatasetBatch,
  type DatasetBatchItem,
  type DatasetPageParams,
  type DatasetPageResult,
  type DatasetQueryParams,
  type DatasetQueryResult,
} from '@/api/dataset'

/** 合并窗口: 让同一事件循环/同一帧内的组件请求进入同一批 */
const FLUSH_DELAY_MS = 24
/** 单批上限, 与后端 DTO 保持一致 */
const MAX_BATCH_ITEMS = 20
/** 批量失败回退时的并发上限 */
const FALLBACK_CONCURRENCY = 4

export type DatasetExecuteResult = {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

interface PendingEntry {
  item: DatasetBatchItem
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}

let queue: PendingEntry[] = []
let timer: ReturnType<typeof setTimeout> | null = null
/** 相同查询在途/排队时复用同一个 Promise */
const inflight = new Map<string, Promise<unknown>>()

/** 计算去重 key: 数据集 + 取数方式 + 参数 (排序字段等) */
function requestKey(item: DatasetBatchItem): string {
  if (item.kind === 'execute') {
    return JSON.stringify(['execute', item.datasetId, item.limit ?? null, item.params ?? null])
  }
  if (item.kind === 'query') {
    return JSON.stringify(['query', item.datasetId, item.query])
  }
  return JSON.stringify(['page', item.datasetId, item.page ?? {}])
}

function scheduleFlush(): void {
  if (timer !== null) return
  timer = setTimeout(() => {
    timer = null
    void flushQueue()
  }, FLUSH_DELAY_MS)
}

/** 单请求回退 (批量接口不可用时) */
async function executeSingle(item: DatasetBatchItem): Promise<unknown> {
  switch (item.kind) {
    case 'execute': {
      const body: { limit?: number; params?: Record<string, unknown> } = {}
      if (item.limit !== undefined) body.limit = item.limit
      if (item.params !== undefined) body.params = item.params
      return (await executeDataset(item.datasetId, body)).data
    }
    case 'query':
      return (await queryDataset(item.datasetId, item.query)).data
    case 'page':
      return (await fetchDatasetPage(item.datasetId, item.page ?? {})).data
  }
}

/** 整个批量请求失败时, 逐项回退到单请求 (限制并发) */
async function fallbackBatch(batch: PendingEntry[]): Promise<void> {
  let cursor = 0
  const worker = async (): Promise<void> => {
    while (cursor < batch.length) {
      const entry = batch[cursor++]
      try {
        entry.resolve(await executeSingle(entry.item))
      } catch (err) {
        entry.reject(err)
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(FALLBACK_CONCURRENCY, batch.length) }, () => worker()),
  )
}

async function runBatch(batch: PendingEntry[]): Promise<void> {
  if (batch.length === 0) return

  // 批量响应与请求顺序一一对应; 显式 key 便于排障
  const items: DatasetBatchItem[] = batch.map((entry, index) => ({
    ...entry.item,
    key: `i${index}`,
  }))

  try {
    const res = await fetchDatasetBatch(items)
    const results = res.data
    if (!Array.isArray(results)) throw new Error('批量取数响应格式异常')

    batch.forEach((entry, index) => {
      const result = results[index]
      if (!result) {
        entry.reject(new Error('批量取数结果缺失'))
        return
      }
      if (result.ok) {
        entry.resolve(result.data)
      } else {
        entry.reject(new Error(result.error?.message || '数据加载失败'))
      }
    })
  } catch {
    // 批量接口整体失败 (旧版后端 404 / 网络异常 / 超时) → 回退单请求
    await fallbackBatch(batch)
  }
}

async function flushQueue(): Promise<void> {
  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_BATCH_ITEMS)
    await runBatch(batch)
  }
}

function enqueue<T>(item: DatasetBatchItem): Promise<T> {
  const key = requestKey(item)
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = new Promise<T>((resolve, reject) => {
    queue.push({ item, resolve: resolve as (value: unknown) => void, reject })
    scheduleFlush()
  })
  inflight.set(key, promise)
  // 完成后移除, 允许后续刷新拿到最新数据; 用双回调避免产生未处理的 rejection
  promise.then(
    () => inflight.delete(key),
    () => inflight.delete(key),
  )
  return promise
}

/** 执行数据集 SQL (原始行) */
export function requestDatasetExecute(
  datasetId: number,
  limit?: number,
  params?: Record<string, unknown>,
): Promise<DatasetExecuteResult> {
  return enqueue<DatasetExecuteResult>({ kind: 'execute', datasetId, limit, params })
}

/** 聚合查询 (服务端 GROUP BY) */
export function requestDatasetQuery(
  datasetId: number,
  query: DatasetQueryParams,
): Promise<DatasetQueryResult> {
  return enqueue<DatasetQueryResult>({ kind: 'query', datasetId, query })
}

/** 服务端分页 (表格组件) */
export function requestDatasetPage(
  datasetId: number,
  page: DatasetPageParams = {},
): Promise<DatasetPageResult> {
  return enqueue<DatasetPageResult>({ kind: 'page', datasetId, page })
}

// ============================================================================
// 测试辅助
// ============================================================================

/** 立即冲刷队列 (单测用, 避免等待 24ms) */
export async function flushDatasetBatchQueueForTest(): Promise<void> {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  await flushQueue()
}

/** 重置调度器状态 (单测用) */
export function resetDatasetBatchForTest(): void {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  queue = []
  inflight.clear()
}

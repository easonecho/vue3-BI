/// <reference lib="webworker" />

// 🔑 本文件以 Worker 脚本身份运行（由 `?worker` 引入），self 实为 DedicatedWorkerGlobalScope。
//   同时被主工程 DOM lib 编译时，`self` 被声明为 Window & typeof globalThis，
//   因此在入口处收窄一次，避免每个 postMessage 都写 `(self as any)`。
const workerScope = self as unknown as { postMessage: (message: unknown) => void }

/**
 * 🔑 数据集映射 Worker：把大数据集的 categories + series 映射计算移到后台线程。
 *
 * 主线程只负责 UI 和拖拽，重计算（1000+ 行 × N 个 valueFields 的 map + Number 转换）
 * 不阻塞 60fps。
 *
 * 通信协议：
 *   主线程 → Worker: { id, rows, categoryField, valueFields }
 *   Worker → 主线程: { id, result: { categories, series } | null }
 *   id 用于只接受最新请求的结果（防止过期回调覆盖新数据）
 */
self.onmessage = (e: MessageEvent) => {
  const { id, rows, categoryField, valueFields } = e.data as {
    id: number
    rows: Record<string, unknown>[]
    categoryField?: string
    valueFields?: string[]
  }

  if (!categoryField || !valueFields?.length || !rows.length) {
    workerScope.postMessage({ id, result: null })
    return
  }

  // 🔑 在 Worker 中完成全量映射，主线程零计算开销
  const categories = rows.map((r) => String(r[categoryField] ?? ''))
  const series = valueFields.map((f) => ({
    name: f,
    data: rows.map((r) => Number(r[f] ?? 0)),
  }))

  workerScope.postMessage({ id, result: { categories, series } })
}

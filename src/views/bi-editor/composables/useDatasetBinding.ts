/**
 * 🔑 数据集绑定 composable —— 封装 executeDataset 取数 + 字段推断 + 数据缓存。
 *   各图表 Widget.vue 用此 hook 获取数据集行数据,再根据自身 dataConfig 做字段映射。
 *
 *   设计:
 *   - 取数:executeDataset(datasetId) → Record[] 行数据
 *   - 字段推断:从首行 keys 提取字段名列表(后端 Dataset.fields 是 Record<string, unknown>,结构不明,用首行推断更可靠)
 *   - 缓存:模块级 Map 按 datasetId 缓存取数结果,避免多组件绑同数据集重复请求
 *   - 自动重取:watch dataSource.datasetId 变化时自动重新取数
 */
import { ref, watch, computed, onUnmounted, getCurrentInstance, type Ref, type ComputedRef } from 'vue'
import { executeDataset, queryDataset, type DatasetQueryParams } from '@/api/dataset'
import { executePublicDataset, queryPublicDataset } from '@/api/share'
import { getPublicDashboardContext } from '@/utils/public-dashboard-context'
import { useLinkageStore } from '@/stores/linkage'
import { applyRowFilters } from './linkage-filter'

/** 模块级缓存:cacheKey → { rows, fields, ts },同一数据集只取一次。缓存保存全量行,筛选后再采样 */
const datasetCache = new Map<
  string,
  { rows: Record<string, unknown>[]; fields: string[]; ts: number }
>()

/**
 * 🔑 in-flight Promise 缓存:cacheKey → 当前进行中的取数 Promise。
 *
 * 性能优化:多个图表 Widget 绑定同一 datasetId 时,首次加载若只缓存"已解析数据",
 *   所有 Widget 实例的同步缓存检查都会未命中 → 并发发起 N 个相同请求。
 *   缓存 in-flight Promise 后,所有并发调用者共享同一 Promise,只发一次请求。
 *   Promise resolve 后写入 datasetCache 并清除 in-flight 记录。
 */
const inflightRequests = new Map<
  string,
  Promise<{ rows: Record<string, unknown>[]; fields: string[] }>
>()

/**
 * 🔑 缓存 key:公开分享/嵌入页与登录态使用独立命名空间,
 *   避免分享页匿名取数结果与编辑器鉴权取数结果互相串用。
 */
function buildCacheKey(datasetId: number): string {
  const publicCtx = getPublicDashboardContext()
  return publicCtx ? `public:${publicCtx.token}:${datasetId}` : `auth:${datasetId}`
}

/** 缓存有效期 5 分钟(同一编辑会话内不重复请求) */
const CACHE_TTL = 5 * 60 * 1000

/**
 * 🔑 大数据集采样：超过 SAMPLE_SIZE 行的数据集等距采样到 SAMPLE_SIZE 行。
 *   避免大数据集（10万行）直接进 ECharts 导致编辑器卡顿。
 *   fields 仍从全量数据推断，不受采样影响。
 */
const SAMPLE_SIZE = 2000

/** 等距采样：保留数据分布特征，比 slice(0, N) 更有代表性 */
function sampleRows(rows: Record<string, unknown>[], size: number): Record<string, unknown>[] {
  if (rows.length <= size) return rows
  const step = rows.length / size
  const result: Record<string, unknown>[] = []
  for (let i = 0; i < size; i++) {
    result[i] = rows[Math.floor(i * step)]
  }
  return result
}

/** 手动清除指定数据集缓存(配置变更后可调用) */
export function invalidateDatasetCache(datasetId: number) {
  const suffix = `:${datasetId}`
  for (const key of datasetCache.keys()) {
    if (key.endsWith(suffix)) datasetCache.delete(key)
  }
  for (const key of inflightRequests.keys()) {
    if (key.endsWith(suffix)) inflightRequests.delete(key)
  }
}

/** 清除全部缓存(看板切换时调用) */
export function clearAllDatasetCache() {
  datasetCache.clear()
  inflightRequests.clear()
}

/**
 * 🔑 性能优化：全局刷新信号。
 *   refreshAllData 递增此值，所有 useDatasetBinding 实例自动重新取数。
 *   替代旧的 v-for key 强制重挂载机制，避免 ECharts/VDR/ResizeObserver 全部重新初始化。
 */
const refreshSignal = ref(0)

/** 全局刷新信号：供其他取数 composable（如服务端分页）复用同一刷新机制 */
export { refreshSignal }

/** 触发所有 useDatasetBinding 实例重新取数（配合 clearAllDatasetCache 使用） */
export function triggerDatasetRefresh() {
  refreshSignal.value++
}

export function useDatasetBinding(
  dataSource: Ref<{ datasetId: number | null }>,
  /** 是否自动监听 dataSource 变化重新取数,默认 true */
  autoWatch = true,
  /**
   * 🔑 聚合下推请求:非空时走服务端 GROUP BY,返回聚合结果行;
   *   null/undefined 时沿用原始行取数 + 客户端联动过滤。
   */
  aggregateRequest?: Ref<DatasetQueryParams | null>,
) {
  const linkageStore = useLinkageStore()
  // 🔑 组件 ID 从当前 setup 实例的 props.comp 推断,避免修改所有 Widget 调用点。
  //    用于联动筛选时排除源组件自身;非组件场景(如右侧面板数据预览)为 undefined。
  const componentId = (() => {
    const comp = (getCurrentInstance()?.props as Record<string, unknown> | undefined)?.comp as
      | { id?: string }
      | undefined
    return comp?.id ? String(comp.id) : undefined
  })()

  const rawRows = ref<Record<string, unknown>[]>([])
  const fields = ref<string[]>([])
  const loading = ref(false)
  const error = ref('')
  /** 🔑 当前数据是否已在服务端完成过滤+聚合 (此时不再重复客户端联动过滤) */
  const serverFiltered = ref(false)

  /** 🔑 联动/钻取/全局筛选后展示行:先过滤再等距采样,避免采样丢弃筛选目标 */
  const rows = computed<Record<string, unknown>[]>(() => {
    const source = serverFiltered.value
      ? rawRows.value
      : applyRowFilters(rawRows.value, {
          globalFilters: linkageStore.filterValues,
          linkFilters: linkageStore.linkFilters,
          drillFilters: componentId ? linkageStore.getDrillStack(componentId) : [],
          componentId,
        })
    return sampleRows(source, SAMPLE_SIZE)
  })

  async function loadData() {
    const datasetId = dataSource.value.datasetId
    if (!datasetId) {
      rawRows.value = []
      fields.value = []
      serverFiltered.value = false
      return
    }

    // 🔑 聚合下推规格:非空时服务端执行 GROUP BY,缓存 key 需包含完整规格
    const spec = aggregateRequest?.value ?? null
    const cacheKey = spec
      ? `agg:${JSON.stringify(spec)}:${buildCacheKey(datasetId)}`
      : buildCacheKey(datasetId)

    // 命中缓存且未过期 → 直接用
    const cached = datasetCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      rawRows.value = cached.rows
      fields.value = cached.fields
      serverFiltered.value = !!spec
      return
    }

    // 🔑 命中 in-flight Promise → 复用进行中的请求,避免并发重复发起
    const inflight = inflightRequests.get(cacheKey)
    if (inflight) {
      loading.value = true
      try {
        const data = await inflight
        rawRows.value = data.rows
        fields.value = data.fields
        serverFiltered.value = !!spec
        error.value = ''
      } catch {
        // 复用失败结果;错误已在原发起方记录
        rawRows.value = []
        fields.value = []
      } finally {
        loading.value = false
      }
      return
    }

    // 🔑 发起新请求:把 Promise 写入 in-flight 缓存,所有并发调用者共享
    const requestPromise = (async () => {
      const publicCtx = getPublicDashboardContext()
      const res = spec
        ? publicCtx
          ? await queryPublicDataset(publicCtx.token, datasetId, {
              password: publicCtx.password,
              ...spec,
            })
          : await queryDataset(datasetId, spec)
        : publicCtx
          ? await executePublicDataset(publicCtx.token, datasetId, {
              password: publicCtx.password,
              limit: 5000,
            })
          : await executeDataset(datasetId)
      // 🔑 后端 execute/query 返回 { columns, rows, rowCount };优先用 rows,columns 作字段名兜底
      const list = res.data.rows ?? []
      // 字段名:优先用后端返回的 columns,否则从首行 keys 推断
      const inferredFields = res.data.columns?.length
        ? res.data.columns
        : list.length > 0
          ? Object.keys(list[0])
          : []
      // 缓存结果行,展示时再采样(聚合结果不再走客户端过滤)
      datasetCache.set(cacheKey, {
        rows: list,
        fields: inferredFields.slice(),
        ts: Date.now(),
      })
      return { rows: list, fields: inferredFields }
    })()

    inflightRequests.set(cacheKey, requestPromise)

    loading.value = true
    error.value = ''
    try {
      const data = await requestPromise
      rawRows.value = data.rows
      fields.value = data.fields
      serverFiltered.value = !!spec
    } catch (e) {
      console.error('[useDatasetBinding] 取数失败:', e)
      error.value = e instanceof Error ? e.message : '数据加载失败'
      rawRows.value = []
      fields.value = []
      serverFiltered.value = false
    } finally {
      // 🔑 请求结束(成功或失败)都清除 in-flight 记录,允许后续重试
      inflightRequests.delete(cacheKey)
      loading.value = false
    }
  }

  if (autoWatch) {
    watch(
      () => dataSource.value.datasetId,
      () => loadData(),
      { immediate: true },
    )
    // 🔑 性能优化：监听全局刷新信号，refreshAllData 后自动重新取数
    //   替代旧的 v-for key 强制重挂载机制，避免 ECharts/VDR/ResizeObserver 全部重新初始化
    watch(refreshSignal, () => loadData())
    // 🔑 聚合规格变化 (切换聚合方式/映射字段/联动筛选/钻取) → 重新请求
    if (aggregateRequest) {
      watch(() => JSON.stringify(aggregateRequest.value), () => loadData())
    }
  }

  return { rows, fields, loading, error, loadData }
}

// ==================== 🔑 Worker 数据集映射（categories + series） ====================

/**
 * 🔑 Worker 数据集映射：把大数据集的 categories + series 映射计算移到后台线程。
 *
 *   小数据集（<= WORKER_THRESHOLD 行）：直接在主线程计算，避免 Worker 通信开销。
 *   大数据集（> WORKER_THRESHOLD 行）：postMessage 给 Worker，主线程零计算开销。
 *
 *   适用图表：bar / line / scatter / combo（categories + series 映射）。
 *   其他图表（pie / radar / funnel / heatmap）的映射逻辑不同，仍用主线程 computed。
 *
 *   设计：共享 Worker 实例（所有图表共用一个 Worker），通过 requestId 区分请求结果。
 */
const WORKER_THRESHOLD = 500

let sharedWorker: Worker | null = null
let workerRefCount = 0

function getSharedWorker(): Worker {
  if (!sharedWorker) {
    sharedWorker = new Worker(new URL('./dataset-worker.ts', import.meta.url), { type: 'module' })
  }
  return sharedWorker
}

export function useWorkerMappedData(
  rows: Ref<Record<string, unknown>[]>,
  categoryField: ComputedRef<string | undefined>,
  valueFields: ComputedRef<string[] | undefined>,
) {
  const result = ref<{ categories: string[]; series: { name: string; data: number[] }[] } | null>(null)
  let requestId = 0

  const worker = getSharedWorker()
  workerRefCount++

  function onWorkerMessage(e: MessageEvent) {
    if (e.data.id !== requestId) return
    result.value = e.data.result
  }
  worker.addEventListener('message', onWorkerMessage)

  watch(
    [rows, categoryField, valueFields],
    () => {
      const cat = categoryField.value
      const vals = valueFields.value
      if (!cat || !vals?.length || rows.value.length === 0) {
        result.value = null
        return
      }

      if (rows.value.length > WORKER_THRESHOLD) {
        // 🔑 大数据集：用 Worker，主线程零计算开销
        const id = ++requestId
        worker.postMessage({ id, rows: rows.value, categoryField: cat, valueFields: vals })
      } else {
        // 🔑 小数据集：直接计算（避免 Worker 通信开销）
        const r = rows.value
        result.value = {
          categories: r.map((row) => String(row[cat] ?? '')),
          series: vals.map((f) => ({
            name: f,
            data: r.map((row) => Number(row[f] ?? 0)),
          })),
        }
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    worker.removeEventListener('message', onWorkerMessage)
    workerRefCount--
    if (workerRefCount <= 0 && sharedWorker) {
      sharedWorker.terminate()
      sharedWorker = null
      workerRefCount = 0
    }
  })

  return result
}

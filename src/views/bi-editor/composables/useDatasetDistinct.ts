/**
 * 筛选器候选值 composable
 *
 * 筛选器绑定数据集后, 通过 /api/datasets/:id/distinct (公开分享走 /api/public/...)
 * 获取服务端去重后的可选值:
 *   - 服务端已应用租户/数据范围/行级权限(RLS)/列级权限, 前端不再拉全量行
 *   - 支持关键字远程搜索, 默认只取 200 个值, 超过 500 个由后端硬截断
 *   - 同一数据集+字段+关键字在 5 分钟内复用缓存, 刷新看板时主动重取
 */
import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import { fetchDatasetDistinct, type DatasetDistinctResult } from '@/api/dataset'
import { fetchPublicDatasetDistinct } from '@/api/share'
import { getPublicDashboardContext } from '@/utils/public-dashboard-context'
import { refreshSignal } from './useDatasetBinding'

interface DistinctCacheEntry {
  values: Array<string | number | boolean>
  truncated: boolean
  ts: number
}

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, DistinctCacheEntry>()
const inflight = new Map<string, Promise<DatasetDistinctResult>>()

/** 缓存 key: 公开分享与登录态隔离, 避免不同看板复用同一候选值 */
export function buildDistinctCacheKey(
  datasetId: number,
  field: string,
  limit: number,
  search = '',
): string {
  const publicCtx = getPublicDashboardContext()
  const scope = publicCtx ? `public:${publicCtx.token}` : 'auth'
  return `${scope}:${datasetId}:${field}:${limit}:${search}`
}

/** 后端返回值 → el-select options (值统一转字符串, 与联动过滤的比较语义一致) */
export function toFilterOptions(values: Array<string | number | boolean>) {
  return values.map((value) => ({ label: String(value), value: String(value) }))
}

/** 手动清除候选值缓存 (数据集更新/权限变更后可按需调用) */
export function invalidateDatasetDistinctCache(datasetId?: number) {
  for (const key of cache.keys()) {
    if (datasetId === undefined || key.includes(`:${datasetId}:`)) cache.delete(key)
  }
}

/**
 * @param datasetId 绑定的数据集 ID (未绑定为空)
 * @param field 筛选字段 (优先 dataConfig.field, 回退 filterKey)
 * @param enabled 是否启用 (仅 select / multi-select 需要候选值)
 */
export function useDatasetDistinct(
  datasetId: Ref<number | null | undefined>,
  field: Ref<string | undefined>,
  enabled: Ref<boolean> = ref(true),
  limit = 200,
) {
  const values = ref<Array<string | number | boolean>>([])
  const truncated = ref(false)
  const loading = ref(false)
  const error = ref('')
  const query = ref('')
  const resolvedField = ref('')

  const currentKey = computed(() => {
    const id = Number(datasetId.value || 0)
    const f = String(field.value || '')
    return id && f && enabled.value ? buildDistinctCacheKey(id, f, limit) : ''
  })

  let requestSeq = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function reset() {
    values.value = []
    truncated.value = false
    error.value = ''
    resolvedField.value = ''
  }

  async function load(search = query.value) {
    const id = Number(datasetId.value || 0)
    const f = String(field.value || '')
    if (!id || !f || !enabled.value) {
      reset()
      return
    }

    const key = buildDistinctCacheKey(id, f, limit, search)
    const cached = !search ? cache.get(key) : undefined
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      values.value = cached.values
      truncated.value = cached.truncated
      error.value = ''
      return
    }

    const seq = ++requestSeq
    loading.value = true
    error.value = ''

    try {
      let task = inflight.get(key)
      if (!task) {
        const body = { field: f, limit, ...(search ? { search } : {}) }
        const publicCtx = getPublicDashboardContext()
        task = (
          publicCtx
            ? fetchPublicDatasetDistinct(publicCtx.token, id, {
                ...body,
                password: publicCtx.password,
              })
            : fetchDatasetDistinct(id, body)
        ).then((res) => res.data)
        inflight.set(key, task)
        void task.finally(() => inflight.delete(key)).catch(() => undefined)
      }

      const data = await (task as Promise<DatasetDistinctResult>)
      if (seq !== requestSeq) return
      values.value = data.values ?? []
      truncated.value = !!data.truncated
      resolvedField.value = data.field || f
      if (!search) {
        cache.set(key, {
          values: values.value,
          truncated: truncated.value,
          ts: Date.now(),
        })
      }
    } catch (e) {
      if (seq !== requestSeq) return
      values.value = []
      truncated.value = false
      error.value = e instanceof Error ? e.message : '候选值加载失败'
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  /** el-select remote-method: 250ms 防抖, 避免每次按键都请求 */
  function handleSearch(term: string) {
    query.value = term
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => load(term), 250)
  }

  /** 下拉关闭时恢复默认候选值 */
  function resetSearch() {
    query.value = ''
    if (timer) clearTimeout(timer)
    load('')
  }

  watch(
    [datasetId, field, enabled],
    () => {
      query.value = ''
      load('')
    },
    { immediate: true },
  )
  watch(refreshSignal, () => load(query.value))

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return {
    values,
    truncated,
    loading,
    error,
    resolvedField,
    currentKey,
    load,
    handleSearch,
    resetSearch,
  }
}

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
import { ref, watch, type Ref } from 'vue'
import { executeDataset } from '@/api/dataset'

/** 模块级缓存:datasetId → { rows, fields, ts },同一数据集只取一次 */
const datasetCache = new Map<
  number,
  { rows: Record<string, unknown>[]; fields: string[]; ts: number }
>()

/** 缓存有效期 5 分钟(同一编辑会话内不重复请求) */
const CACHE_TTL = 5 * 60 * 1000

/** 手动清除指定数据集缓存(配置变更后可调用) */
export function invalidateDatasetCache(datasetId: number) {
  datasetCache.delete(datasetId)
}

/** 清除全部缓存(看板切换时调用) */
export function clearAllDatasetCache() {
  datasetCache.clear()
}

export function useDatasetBinding(
  dataSource: Ref<{ datasetId: number | null }>,
  /** 是否自动监听 dataSource 变化重新取数,默认 true */
  autoWatch = true,
) {
  const rows = ref<Record<string, unknown>[]>([])
  const fields = ref<string[]>([])
  const loading = ref(false)
  const error = ref('')

  async function loadData() {
    const datasetId = dataSource.value.datasetId
    if (!datasetId) {
      rows.value = []
      fields.value = []
      return
    }

    // 命中缓存且未过期 → 直接用
    const cached = datasetCache.get(datasetId)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      rows.value = cached.rows
      fields.value = cached.fields
      return
    }

    loading.value = true
    error.value = ''
    try {
      const res = await executeDataset(datasetId)
      // 🔑 后端 execute 返回 { columns, rows, rowCount };优先用 rows,columns 作字段名兜底
      const list = res.data.rows ?? []
      rows.value = list
      // 字段名:优先用后端返回的 columns,否则从首行 keys 推断
      fields.value = res.data.columns?.length
        ? res.data.columns
        : list.length > 0
          ? Object.keys(list[0])
          : []
      // 写入缓存
      datasetCache.set(datasetId, {
        rows: list,
        fields: fields.value.slice(),
        ts: Date.now(),
      })
    } catch (e) {
      console.error('[useDatasetBinding] 取数失败:', e)
      error.value = e instanceof Error ? e.message : '数据加载失败'
      rows.value = []
      fields.value = []
    } finally {
      loading.value = false
    }
  }

  if (autoWatch) {
    watch(
      () => dataSource.value.datasetId,
      () => loadData(),
      { immediate: true },
    )
  }

  return { rows, fields, loading, error, loadData }
}

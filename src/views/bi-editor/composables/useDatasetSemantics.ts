/**
 * 🔑 数据集语义层 (轻量)
 *
 * 数据集的字段配置 (Dataset.fields) 除别名字/类型/计算字段外, 还承载语义元数据:
 *   - role: dimension(维度) | measure(度量)
 *   - defaultAggregate: 度量的默认聚合方式
 *   - format: 展示格式 (数值/货币/百分比/日期/文本 + 小数位/前后缀)
 *
 * 编辑器侧通过本模块拿到「数据集 → 字段语义」映射, 用于:
 *   - 字段映射下拉选项的语义排序与标签提示
 *   - 表格组件按语义格式渲染数值
 *   - 提示/应用度量的默认聚合方式
 *
 * 数据来源: 数据集列表接口 (一次性拉取, 模块级缓存); 失败时静默降级为空语义。
 */
import { ref } from 'vue'
import { getDatasetList, type DatasetField, type DatasetFieldFormat } from '@/api/dataset'
import type { Dataset } from '@/api/types'

/** datasetId → 字段定义 */
const semantics = ref<Map<number, DatasetField[]>>(new Map())
let loading: Promise<void> | null = null

/** 聚合方式中文标签 */
export const AGGREGATE_LABELS: Record<string, string> = {
  none: '不聚合',
  sum: '求和',
  avg: '平均值',
  count: '计数',
  countDistinct: '去重计数',
  max: '最大值',
  min: '最小值',
}

/** 显示格式中文标签 */
export const FORMAT_LABELS: Record<string, string> = {
  number: '数值',
  currency: '货币',
  percent: '百分比',
  date: '日期',
  text: '文本',
}

/** fields 可能是 JSON 字符串或数组 */
function normalizeFields(fields: unknown): DatasetField[] {
  if (Array.isArray(fields)) return fields as DatasetField[]
  if (typeof fields === 'string' && fields.trim()) {
    try {
      const parsed = JSON.parse(fields)
      return Array.isArray(parsed) ? (parsed as DatasetField[]) : []
    } catch {
      return []
    }
  }
  return []
}

/** 注册已加载的数据集语义 (供列表接口复用, 避免重复请求) */
export function registerDatasetSemantics(list: Dataset[]): void {
  if (!list?.length) return
  const next = new Map(semantics.value)
  for (const ds of list) {
    next.set(ds.id, normalizeFields(ds.fields))
  }
  semantics.value = next
}

/** 拉取数据集语义 (模块级只请求一次; 已注册时直接返回) */
export function ensureDatasetSemantics(): Promise<void> {
  if (semantics.value.size > 0) return Promise.resolve()
  if (loading) return loading
  loading = (async () => {
    try {
      // 🔑 后端分页校验限制 pageSize ≤ 100, 因此按页拉取直到取全, 避免一次 500 被拒
      const PAGE_SIZE = 100
      const all: Dataset[] = []
      let page = 1
      let total = 0
      do {
        const res = await getDatasetList({ page, pageSize: PAGE_SIZE })
        const list = res.data.list ?? []
        all.push(...list)
        total = res.data.total ?? all.length
        if (list.length < PAGE_SIZE) break
        page += 1
      } while (all.length < total)
      registerDatasetSemantics(all)
    } catch {
      // 无语义元数据时按原始字段展示
    } finally {
      loading = null
    }
  })()
  return loading
}

/** 某数据集的字段定义列表 */
export function getDatasetFieldDefs(datasetId?: number | null): DatasetField[] {
  if (!datasetId) return []
  return semantics.value.get(datasetId) ?? []
}

/**
 * 按「展示名 (alias) 或原始字段名」解析字段语义。
 * execute 返回的列名是别名, 因此两种都要匹配。
 */
export function getFieldSemantic(
  datasetId: number | null | undefined,
  fieldName: string | undefined | null,
): DatasetField | undefined {
  if (!datasetId || !fieldName) return undefined
  const defs = getDatasetFieldDefs(datasetId)
  return defs.find((f) => (f.alias || f.name) === fieldName || f.name === fieldName)
}

/**
 * 按语义格式渲染值:
 *   - percent: 按比例值显示 (0.25 → 25.0%)
 *   - currency: 默认前缀 ¥, 千分位, 默认 2 位小数
 *   - number: 千分位, 默认 0 位小数
 *   - date/text/未配置: 原样字符串
 */
export function formatSemanticValue(value: unknown, format?: DatasetFieldFormat): string {
  if (value === null || value === undefined || value === '') return '-'
  if (!format?.type || format.type === 'text' || format.type === 'date') return String(value)

  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)

  const prefix = format.prefix ?? (format.type === 'currency' ? '¥' : '')
  const suffix = format.suffix ?? ''

  if (format.type === 'percent') {
    const decimals = format.decimals ?? 1
    return `${prefix}${(n * 100).toFixed(decimals)}${suffix || '%'}`
  }

  const decimals = format.decimals ?? (format.type === 'currency' ? 2 : 0)
  const text = n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${prefix}${text}${suffix}`
}

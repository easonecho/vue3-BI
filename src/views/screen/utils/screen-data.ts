import type { CategorySeriesData, PieDatum } from './screen-chart-options'

/** 顶部 KPI 卡片 */
export interface KpiItem {
  label: string
  value: string
  unit: string
  color: string
}

/** 运行指标进度项 */
export interface RateItem {
  label: string
  value: number
  color: string
}

/** 榜单行 */
export interface RankingItem {
  name: string
  value: number
  percent: number
}

/** 从 layout.components 中收窄出的图表配置 */
export interface ScreenChartConfig {
  id: string
  type: string
  datasetId: number
  props: Record<string, unknown>
  dataConfig: Record<string, unknown>
}

export const DEMO_RATES: RateItem[] = [
  { label: '销售目标达成率', value: 78.4, color: '#00eaff' },
  { label: '回款达成率', value: 64.2, color: '#4ade80' },
  { label: '用户增长目标', value: 55.9, color: '#f7c365' },
  { label: '工单处理率', value: 91.3, color: '#c084fc' },
]

export const DEMO_RANKING: RankingItem[] = [
  { name: '华东大区', value: 986420, percent: 100 },
  { name: '华南大区', value: 752100, percent: 76 },
  { name: '华北大区', value: 634800, percent: 64 },
  { name: '西南大区', value: 442160, percent: 45 },
  { name: '华中大区', value: 338200, percent: 34 },
  { name: '西北大区', value: 214000, percent: 22 },
  { name: '东北大区', value: 182500, percent: 18 },
  { name: '青藏大区', value: 88200, percent: 9 },
]

const PIE_CHART_TYPES = ['pie-chart', 'pie-rose-chart']
const BAR_CHART_TYPES = ['bar-chart', 'combo-chart']
const LINE_CHART_TYPES = ['line-chart', 'area-chart']

const PREFERRED_NAME_FIELDS = ['name', 'label', 'region', 'category', 'province', 'city']
const PREFERRED_VALUE_FIELDS = ['value', 'count', 'amount', 'sales', 'total', 'qty']

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const num = Number(trimmed)
    return Number.isFinite(num) ? num : null
  }
  return null
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

/** 读取字符串字段（去首尾空格，空串返回 null） */
export function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

/** 读取字符串数组字段（过滤空项） */
export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** 从 layout 中提取所有已绑定数据集的图表组件 */
export function parseLayoutChartConfigs(layout: unknown): ScreenChartConfig[] {
  const components = readRecord(layout).components
  if (!Array.isArray(components)) return []

  const result: ScreenChartConfig[] = []
  for (const item of components) {
    const component = readRecord(item)
    if (component.visible === false) continue
    const dataSource = component.dataSource
    const datasetId = readNumber(
      typeof dataSource === 'number' ? dataSource : readRecord(dataSource).datasetId,
    )
    if (datasetId === null || datasetId <= 0) continue
    const type = readString(component.type)
    if (!type) continue
    result.push({
      id: String(component.id ?? ''),
      type,
      datasetId,
      props: readRecord(component.props),
      dataConfig: readRecord(component.dataConfig),
    })
  }
  return result
}

/** 兼容旧布局：顶层 layout.datasetId / layout.dataSource.datasetId */
export function extractLayoutDatasetId(layout: unknown): number | null {
  const record = readRecord(layout)
  const direct = readNumber(record.datasetId)
  if (direct !== null && direct > 0) return direct
  const nested = readNumber(readRecord(record.dataSource).datasetId)
  return nested !== null && nested > 0 ? nested : null
}

/** 按类型优先级查找第一个图表配置 */
export function findChartConfig(
  configs: ScreenChartConfig[],
  types: string[],
): ScreenChartConfig | null {
  for (const type of types) {
    const found = configs.find((config) => config.type === type)
    if (found) return found
  }
  return null
}

/** 查找饼图配置 */
export function findPieConfig(configs: ScreenChartConfig[]): ScreenChartConfig | null {
  return findChartConfig(configs, PIE_CHART_TYPES)
}

/** 查找柱状图配置 */
export function findBarConfig(configs: ScreenChartConfig[]): ScreenChartConfig | null {
  return findChartConfig(configs, BAR_CHART_TYPES)
}

/** 查找折线/面积图配置 */
export function findLineConfig(configs: ScreenChartConfig[]): ScreenChartConfig | null {
  return findChartConfig(configs, LINE_CHART_TYPES)
}

/** 饼图数据：过滤空名称/非正数值，最多 8 项 */
export function buildPieData(
  rows: Record<string, unknown>[],
  nameField: string,
  valueField: string,
  limit = 8,
): PieDatum[] {
  if (!nameField || !valueField) return []
  const data: PieDatum[] = []
  for (const row of rows) {
    const name = String(row[nameField] ?? '').trim() || '未命名'
    const value = readNumber(row[valueField])
    if (value === null || value <= 0) continue
    data.push({ name, value })
    if (data.length >= limit) break
  }
  return data
}

/** 类目轴数据：类目 + 多个数值系列 */
export function buildCategorySeries(
  rows: Record<string, unknown>[],
  categoryField: string,
  valueFields: string[],
): CategorySeriesData | null {
  if (!categoryField || valueFields.length === 0 || rows.length === 0) return null
  const categories = rows.map(
    (row) => String(row[categoryField] ?? '').trim() || '未命名',
  )
  const series = valueFields.map((field) => ({
    name: field,
    data: rows.map((row) => {
      const value = readNumber(row[field])
      return value === null ? 0 : value
    }),
  }))
  return { categories, series }
}

/** 从类目轴数据生成榜单（取第一个系列，按数值倒序） */
export function buildRankingFromSeries(
  data: CategorySeriesData | null,
  limit = 8,
): RankingItem[] {
  if (!data || data.series.length === 0) return []
  const first = data.series[0]
  const rows = data.categories
    .map((name, index) => ({ name, value: first.data[index] ?? 0 }))
    .filter((row) => Number.isFinite(row.value) && row.value > 0)
  const max = rows.reduce((current, row) => Math.max(current, row.value), 0)
  if (max <= 0) return []
  return rows
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((row) => ({
      name: row.name,
      value: row.value,
      percent: Math.round((row.value / max) * 100),
    }))
}

/** 从看板列表生成「图表数」榜单 */
export function buildRankingFromDashboards(list: unknown, limit = 8): RankingItem[] {
  if (!Array.isArray(list)) return []
  const rows = list
    .map((item) => {
      const dashboard = readRecord(item)
      const charts = readNumber(readRecord(dashboard._count).charts)
      return {
        name: String(dashboard.name ?? '').trim() || '未命名看板',
        value: charts !== null && charts > 0 ? charts : 0,
      }
    })
    .filter((row) => row.value > 0)
  const max = rows.reduce((current, row) => Math.max(current, row.value), 0)
  if (max <= 0) return []
  return rows
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((row) => ({
      name: row.name,
      value: row.value,
      percent: Math.round((row.value / max) * 100),
    }))
}

export interface RateSourceInput {
  metrics?: {
    http?: { total?: unknown; serverErrors?: unknown } | null
  } | null
  stats?: { users?: unknown; onlineUsers?: unknown } | null
  memory?: { heapUsed?: unknown; heapTotal?: unknown } | null
  dashboards?: { total?: unknown; withCharts?: unknown } | null
}

/**
 * 运行指标：全部来自真实接口，缺一项就少显示一项（不混入演示数据）。
 *   - 接口成功率 = (请求总数 - 5xx) / 请求总数
 *   - 在线用户占比 = 在线用户 / 用户总数
 *   - 内存使用率 = heapUsed / heapTotal
 *   - 看板出图率 = 有图表看板数 / 看板总数
 */
export function buildRatesFromSystem(input: RateSourceInput): RateItem[] {
  const rates: RateItem[] = []

  const httpTotal = readNumber(input.metrics?.http?.total)
  if (httpTotal !== null && httpTotal > 0) {
    const serverErrors = readNumber(input.metrics?.http?.serverErrors) ?? 0
    const success = ((httpTotal - serverErrors) / httpTotal) * 100
    rates.push({ label: '接口成功率', value: clampPercent(success), color: '#00eaff' })
  }

  const users = readNumber(input.stats?.users)
  const onlineUsers = readNumber(input.stats?.onlineUsers)
  if (users !== null && users > 0 && onlineUsers !== null) {
    rates.push({
      label: '在线用户占比',
      value: clampPercent((onlineUsers / users) * 100),
      color: '#4ade80',
    })
  }

  const heapUsed = readNumber(input.memory?.heapUsed)
  const heapTotal = readNumber(input.memory?.heapTotal)
  if (heapUsed !== null && heapTotal !== null && heapTotal > 0) {
    rates.push({
      label: '内存使用率',
      value: clampPercent((heapUsed / heapTotal) * 100),
      color: '#f7c365',
    })
  }

  const dashboardTotal = readNumber(input.dashboards?.total)
  const withCharts = readNumber(input.dashboards?.withCharts)
  if (dashboardTotal !== null && dashboardTotal > 0 && withCharts !== null) {
    rates.push({
      label: '看板出图率',
      value: clampPercent((withCharts / dashboardTotal) * 100),
      color: '#c084fc',
    })
  }

  return rates
}

/**
 * 旧布局兜底：从行数据中推断名称列与数值列。
 * 优先使用常见列名（name/value/...），否则取样本中文本列/数值列。
 */
export function detectNameValueFields(
  rows: Record<string, unknown>[],
): { nameField: string; valueField: string } | null {
  const sample = rows.slice(0, 20)
  if (sample.length === 0) return null
  const keys = Array.from(new Set(sample.flatMap((row) => Object.keys(readRecord(row)))))
  if (keys.length === 0) return null

  const preferred = (candidates: string[], key: string) => {
    const index = candidates.indexOf(key)
    return index === -1 ? candidates.length : index
  }

  let nameField: string | null = null
  let valueField: string | null = null
  let nameRank = Infinity
  let valueRank = Infinity

  for (const key of keys) {
    let numeric = 0
    let text = 0
    for (const row of sample) {
      const value = row[key]
      if (value === null || value === undefined || value === '') continue
      if (typeof value === 'number' || readNumber(value) !== null) numeric += 1
      else text += 1
    }
    if (text > numeric && text > 0) {
      const rank = preferred(PREFERRED_NAME_FIELDS, key)
      if (rank < nameRank) {
        nameRank = rank
        nameField = key
      }
    } else if (numeric > 0) {
      const rank = preferred(PREFERRED_VALUE_FIELDS, key)
      if (rank < valueRank && key !== nameField) {
        valueRank = rank
        valueField = key
      }
    }
  }

  if (!nameField || !valueField || nameField === valueField) return null
  return { nameField, valueField }
}

/** 旧布局兜底：生成饼图数据 */
export function buildLegacyPieData(rows: Record<string, unknown>[]): PieDatum[] {
  const fields = detectNameValueFields(rows)
  if (!fields) return []
  return buildPieData(rows, fields.nameField, fields.valueField)
}

/** 旧布局兜底：生成单系列类目数据 */
export function buildLegacyCategorySeries(
  rows: Record<string, unknown>[],
): CategorySeriesData | null {
  const fields = detectNameValueFields(rows)
  if (!fields) return null
  return buildCategorySeries(rows, fields.nameField, [fields.valueField])
}

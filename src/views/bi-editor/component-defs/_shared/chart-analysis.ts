/**
 * 图表分析指标：占比 / 环比 / 同比
 *
 * 全部基于当前图表已加载的数据序列，在 X 轴类目顺序上计算：
 *   - 占比：当前值 / 该系列总和
 *   - 环比：当前值 vs 前 1 个类目
 *   - 同比：当前值 vs 前 N 个类目（N 由「同比间隔」配置，月度数据建议 12）
 *
 * 只用于 tooltip 展示，不修改 series 原始数据，因此不影响图表渲染与导出。
 * 纯函数，便于单测。
 */

export type NullableNumberArray = (number | null)[]

export interface SeriesAnalysisConfig {
  /** 是否计算占比 */
  showPercent?: boolean
  /** 是否计算环比 / 同比 */
  showCompare?: boolean
  /** 同比间隔（前 N 个类目），默认 12，最小 1 */
  yoyLag?: number
}

export interface SeriesAnalysis {
  percent?: NullableNumberArray
  mom?: NullableNumberArray
  yoy?: NullableNumberArray
}

/** 可计算分析指标的系列类型（散点/饼图/桑基图等不适用） */
const ANALYSIS_SERIES_TYPES = new Set(['bar', 'line'])

/** 单个数据项 → 数值；支持 number / 数字字符串 / { value: number } */
export function toNumericValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return toNumericValue((value as { value: unknown }).value)
  }
  return null
}

/** 提取系列数据（保持索引对齐；空值占位 null） */
export function extractSeriesValues(data: unknown): NullableNumberArray {
  if (!Array.isArray(data)) return []
  return data.map((item) => toNumericValue(item))
}

/** 占比：每个值 / 系列总和 * 100；总和为 0 或无有效值时返回 null */
export function computeSharePercent(values: NullableNumberArray): NullableNumberArray {
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  if (total === 0) return values.map(() => null)
  return values.map((value) => (value === null ? null : (value / total) * 100))
}

/** 环比：与前一项目对比；首项/分母为 0 返回 null */
export function computeMom(values: NullableNumberArray): NullableNumberArray {
  return values.map((value, index) => {
    if (value === null || index === 0) return null
    const previous = values[index - 1]
    if (previous === null || previous === 0) return null
    return ((value - previous) / Math.abs(previous)) * 100
  })
}

/** 同比：与前 N 项目对比；不足 N 项/分母为 0 返回 null */
export function computeYoy(values: NullableNumberArray, lag = 12): NullableNumberArray {
  const step = Math.max(1, Math.floor(lag))
  return values.map((value, index) => {
    if (value === null || index < step) return null
    const base = values[index - step]
    if (base === null || base === 0) return null
    return ((value - base) / Math.abs(base)) * 100
  })
}

/** 百分比格式化；withSign 时正数带 + 号 */
export function formatPercent(value: number | null | undefined, withSign = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  const sign = withSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/** 单个系列的分析结果；不适用/无数据时返回 null */
export function buildSeriesAnalysis(
  series: { type?: unknown; data?: unknown },
  config: SeriesAnalysisConfig,
): SeriesAnalysis | null {
  const type = typeof series.type === 'string' ? series.type : ''
  if (!ANALYSIS_SERIES_TYPES.has(type)) return null
  const values = extractSeriesValues(series.data)
  if (values.length === 0) return null

  const result: SeriesAnalysis = {}
  if (config.showPercent) result.percent = computeSharePercent(values)
  if (config.showCompare) {
    result.mom = computeMom(values)
    result.yoy = computeYoy(values, config.yoyLag ?? 12)
  }
  return result
}

/** 批量计算系列分析结果（索引与 series 对齐，不适用的系列为 null） */
export function buildSeriesAnalyses(
  series: Array<{ type?: unknown; data?: unknown }>,
  config: SeriesAnalysisConfig,
): Array<SeriesAnalysis | null> {
  return series.map((item) => buildSeriesAnalysis(item, config))
}

/** 生成某个数据点的分析文本行 */
export function buildAnalysisLines(
  analysis: SeriesAnalysis | null | undefined,
  dataIndex: number,
  config: { showPercent?: boolean; showCompare?: boolean },
): string[] {
  if (!analysis) return []
  const lines: string[] = []
  if (config.showPercent && analysis.percent) {
    lines.push(`占比：${formatPercent(analysis.percent[dataIndex])}`)
  }
  if (config.showCompare && analysis.mom) {
    lines.push(`环比：${formatPercent(analysis.mom[dataIndex], true)}`)
  }
  if (config.showCompare && analysis.yoy) {
    lines.push(`同比：${formatPercent(analysis.yoy[dataIndex], true)}`)
  }
  return lines
}

/** HTML 转义，避免类目/系列名中的特殊字符破坏 tooltip */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

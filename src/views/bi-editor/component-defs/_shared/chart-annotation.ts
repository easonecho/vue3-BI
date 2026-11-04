/**
 * 🔑 图表注释：文本注释（graphic）/ 标记点（markPoint）。
 *
 *   纯函数构建配置，`applyChartAnnotation` 负责挂载到 series / graphic；
 *   不修改 series 的 data，避免影响图表联动与取数逻辑。
 */

export interface ChartAnnotationConfig {
  show?: unknown
  type?: unknown
  text?: unknown
  value?: unknown
  left?: unknown
  top?: unknown
  color?: unknown
  fontSize?: unknown
}

export interface ChartAnnotationTarget {
  series?: unknown
  graphic?: unknown
}

const DEFAULT_ANNOTATION_COLOR = '#ef4444'
const DEFAULT_ANNOTATION_FONT_SIZE = 12
const ELIGIBLE_SERIES_TYPES = new Set(['bar', 'line', 'scatter'])

function normalizeColor(value: unknown): string {
  const text = String(value ?? '').trim()
  return text || DEFAULT_ANNOTATION_COLOR
}

function normalizeFontSize(value: unknown): number {
  const size = Number(value)
  return Number.isFinite(size) && size > 0 ? size : DEFAULT_ANNOTATION_FONT_SIZE
}

function clampPercent(value: unknown, fallback: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.min(100, numeric))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

/**
 * 构建 markPoint：value 为 0/空时自动标记该系列最大值。
 * 未开启、类型不是 markPoint 时返回 null。
 */
export function buildMarkPointAnnotation(
  config: ChartAnnotationConfig,
): Record<string, unknown> | null {
  if (!config.show) return null
  if (String(config.type ?? 'markPoint') !== 'markPoint') return null

  const text = String(config.text ?? '').trim()
  const rawValue = Number(config.value)
  const hasValue = Number.isFinite(rawValue) && rawValue !== 0
  return {
    symbol: 'pin',
    symbolSize: 46,
    itemStyle: { color: normalizeColor(config.color) },
    label: {
      show: text.length > 0,
      formatter: text,
      color: '#ffffff',
      fontSize: normalizeFontSize(config.fontSize),
    },
    data: [hasValue ? { yAxis: rawValue, name: text } : { type: 'max', name: text }],
  }
}

/**
 * 构建文本注释（ECharts graphic text）。
 * 未开启、类型不是 text 或文本为空时返回 null。
 */
export function buildTextAnnotation(
  config: ChartAnnotationConfig,
): Record<string, unknown> | null {
  if (!config.show) return null
  if (String(config.type ?? 'markPoint') !== 'text') return null

  const text = String(config.text ?? '').trim()
  if (!text) return null

  const left = clampPercent(config.left, 70)
  const top = clampPercent(config.top, 12)
  return {
    type: 'text',
    left: `${left}%`,
    top: `${top}%`,
    z: 1000,
    silent: true,
    style: {
      text,
      fill: normalizeColor(config.color),
      fontSize: normalizeFontSize(config.fontSize),
      fontWeight: 'bold',
    },
  }
}

/**
 * 把注释挂载到图表 option。
 *   - 文本注释：追加到 graphic 数组（保留用户已有 graphic）
 *   - 标记点：挂到第一个 bar/line/scatter 系列
 *
 * @returns 是否成功注入注释
 */
export function applyChartAnnotation(
  option: ChartAnnotationTarget,
  config: ChartAnnotationConfig,
): boolean {
  if (!config.show) return false

  const textAnnotation = buildTextAnnotation(config)
  if (textAnnotation) {
    const existing = Array.isArray(option.graphic)
      ? option.graphic
      : isPlainObject(option.graphic)
        ? [option.graphic]
        : []
    option.graphic = [...existing, textAnnotation]
    return true
  }

  const markPoint = buildMarkPointAnnotation(config)
  if (!markPoint) return false

  const seriesList = Array.isArray(option.series)
    ? option.series
    : option.series
      ? [option.series]
      : []
  const target = seriesList.find((item) => {
    if (!isPlainObject(item)) return false
    const type = item.type
    return typeof type === 'string' && ELIGIBLE_SERIES_TYPES.has(type)
  })
  if (!target || !isPlainObject(target)) return false

  target.markPoint = markPoint
  return true
}

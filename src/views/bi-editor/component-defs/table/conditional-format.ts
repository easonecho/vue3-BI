/**
 * 🔑 表格条件格式：阈值规则 / 色阶 / 数据条。
 *
 *   全部为纯函数，表格 Widget 只负责读取配置行与当前页数据，
 *   样式计算集中在此处，便于单测与后续扩展（图标集、自定义规则等）。
 */

export type ConditionalOperator =
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'eq'
  | 'ne'
  | 'between'
  | 'contains'

/** 阈值规则：value/value2 允许是用户输入的字符串，统一按数值优先解析 */
export interface ConditionalRule {
  field?: unknown
  operator?: unknown
  value?: unknown
  value2?: unknown
  backgroundColor?: unknown
  textColor?: unknown
  bold?: unknown
}

/** 色阶：当前页该字段的最小/最大值映射到 minColor → maxColor */
export interface ColorScaleRule {
  field?: unknown
  minColor?: unknown
  maxColor?: unknown
}

/** 数据条：maxValue > 0 时固定量程，否则取当前页最大值 */
export interface DataBarRule {
  field?: unknown
  color?: unknown
  maxValue?: unknown
}

export interface ColumnRange {
  min: number
  max: number
}

export interface ConditionalCellStyle {
  backgroundColor?: string
  color?: string
  fontWeight?: string
  backgroundImage?: string
}

export interface ConditionalFormatInput {
  value: unknown
  field?: string | null
  rules?: ConditionalRule[]
  scales?: ColorScaleRule[]
  bars?: DataBarRule[]
  /** field → 当前页数值范围（色阶用） */
  ranges?: Record<string, ColumnRange>
  /** field → 数据条量程 */
  dataBarMax?: Record<string, number>
}

const DEFAULT_SCALE_MIN = '#fee2e2'
const DEFAULT_SCALE_MAX = '#dc2626'
const DEFAULT_BAR_COLOR = '#3b82f6'

/** 数值解析：数字/数字字符串转 number，空值/非法值返回 null */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const num = Number(trimmed)
    return Number.isFinite(num) ? num : null
  }
  return null
}

function normalizeColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

/** 统一字段名比较：忽略首尾空格 */
export function normalizeField(value: unknown): string {
  return String(value ?? '').trim()
}

/** 判断单元格值是否命中规则（数值优先，非数值回退字符串比较） */
export function matchesConditionalRule(value: unknown, rule: ConditionalRule): boolean {
  const operator = String(rule.operator ?? '') as ConditionalOperator
  if (!operator) return false

  if (operator === 'contains') {
    if (value === null || value === undefined) return false
    return String(value).includes(String(rule.value ?? ''))
  }

  const actualNumber = toFiniteNumber(value)
  const ruleNumber = toFiniteNumber(rule.value)

  if (operator === 'between') {
    const upper = toFiniteNumber(rule.value2)
    if (actualNumber === null || ruleNumber === null || upper === null) return false
    const lowerBound = Math.min(ruleNumber, upper)
    const upperBound = Math.max(ruleNumber, upper)
    return actualNumber >= lowerBound && actualNumber <= upperBound
  }

  if (actualNumber !== null && ruleNumber !== null) {
    switch (operator) {
      case 'gt':
        return actualNumber > ruleNumber
      case 'gte':
        return actualNumber >= ruleNumber
      case 'lt':
        return actualNumber < ruleNumber
      case 'lte':
        return actualNumber <= ruleNumber
      case 'eq':
        return actualNumber === ruleNumber
      case 'ne':
        return actualNumber !== ruleNumber
      default:
        return false
    }
  }

  const actualText = value === null || value === undefined ? '' : String(value)
  const ruleText = String(rule.value ?? '')
  switch (operator) {
    case 'gt':
      return actualText.localeCompare(ruleText, 'zh-CN') > 0
    case 'gte':
      return actualText.localeCompare(ruleText, 'zh-CN') >= 0
    case 'lt':
      return actualText.localeCompare(ruleText, 'zh-CN') < 0
    case 'lte':
      return actualText.localeCompare(ruleText, 'zh-CN') <= 0
    case 'eq':
      return actualText === ruleText
    case 'ne':
      return actualText !== ruleText
    default:
      return false
  }
}

function styleOfRule(rule: ConditionalRule): ConditionalCellStyle | null {
  const style: ConditionalCellStyle = {}
  const backgroundColor = normalizeColor(rule.backgroundColor)
  if (backgroundColor) style.backgroundColor = backgroundColor
  const textColor = normalizeColor(rule.textColor)
  if (textColor) style.color = textColor
  if (rule.bold) style.fontWeight = '600'
  return Object.keys(style).length > 0 ? style : null
}

/**
 * 按配置顺序查找第一条命中的规则。
 * 命中但没有配置任何样式的规则会被跳过，避免"规则存在但无视觉效果"。
 */
export function findMatchingRuleStyle(
  value: unknown,
  field: string,
  rules: ConditionalRule[],
): ConditionalCellStyle | null {
  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') continue
    if (normalizeField(rule.field) !== field) continue
    if (!matchesConditionalRule(value, rule)) continue
    const style = styleOfRule(rule)
    if (style) return style
  }
  return null
}

/** 当前页字段的数值范围（忽略空值/非法值） */
export function computeColumnRange(
  rows: Record<string, unknown>[],
  field: string,
): ColumnRange | null {
  if (!field) return null
  let min = Infinity
  let max = -Infinity
  let found = false
  for (const row of rows) {
    const value = toFiniteNumber(row?.[field])
    if (value === null) continue
    found = true
    if (value < min) min = value
    if (value > max) max = value
  }
  return found ? { min, max } : null
}

/** 数据条量程：用户配置优先（>0），否则取当前页最大值 */
export function computeDataBarMax(
  rows: Record<string, unknown>[],
  rule: DataBarRule,
): number {
  const configured = toFiniteNumber(rule.maxValue)
  if (configured !== null && configured > 0) return configured
  const range = computeColumnRange(rows, normalizeField(rule.field))
  if (!range) return 0
  return Math.max(0, range.max)
}

interface Rgb {
  r: number
  g: number
  b: number
}

/** 解析 #rgb / #rrggbb；非法颜色返回 null */
export function parseHexColor(value: string): Rgb | null {
  const clean = value.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) return null
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function toHexChannel(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0')
}

/** 两色线性插值，返回 #rrggbb；任一颜色非法时返回 from */
export function interpolateHexColor(from: string, to: string, ratio: number): string {
  const start = parseHexColor(from)
  const end = parseHexColor(to)
  if (!start || !end) return from
  const t = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0))
  return `#${toHexChannel(start.r + (end.r - start.r) * t)}${toHexChannel(
    start.g + (end.g - start.g) * t,
  )}${toHexChannel(start.b + (end.b - start.b) * t)}`
}

/** 根据背景色亮度选择可读的文字颜色（深底白字 / 浅底深字） */
export function contrastTextColor(background: string): string {
  const rgb = parseHexColor(background)
  if (!rgb) return '#111827'
  const channel = (value: number) => {
    const scaled = value / 255
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
  }
  const luminance =
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  return luminance > 0.55 ? '#111827' : '#ffffff'
}

/** 色阶样式：按当前页 min/max 归一化后插值背景色 */
export function resolveColorScaleStyle(
  value: unknown,
  rule: ColorScaleRule,
  range: ColumnRange | null,
): ConditionalCellStyle | null {
  const numeric = toFiniteNumber(value)
  if (numeric === null || !range) return null
  const minColor = normalizeColor(rule.minColor) ?? DEFAULT_SCALE_MIN
  const maxColor = normalizeColor(rule.maxColor) ?? DEFAULT_SCALE_MAX
  const span = range.max - range.min
  const ratio = span <= 0 ? 0.5 : (numeric - range.min) / span
  const backgroundColor = interpolateHexColor(minColor, maxColor, ratio)
  return { backgroundColor, color: contrastTextColor(backgroundColor) }
}

/** 数据条渐变：值为 0/负数或量程无效时返回 null */
export function buildDataBarGradient(
  value: unknown,
  rule: DataBarRule,
  max: number,
): string | null {
  const numeric = toFiniteNumber(value)
  if (numeric === null || numeric <= 0 || max <= 0) return null
  const color = normalizeColor(rule.color) ?? DEFAULT_BAR_COLOR
  const percent = Math.min(100, (numeric / max) * 100)
  const pct = `${Number(percent.toFixed(2))}%`
  return `linear-gradient(90deg, ${color} 0%, ${color} ${pct}, transparent ${pct}, transparent 100%)`
}

/**
 * 计算单元格最终条件样式。
 * 优先级：阈值规则 > 数据条 > 色阶（数据条/色阶只作用于背景，文字色可由规则单独覆盖）。
 */
export function buildConditionalCellStyle(input: ConditionalFormatInput): ConditionalCellStyle {
  const field = normalizeField(input.field)
  if (!field) return {}

  const style: ConditionalCellStyle = {}
  const ruleStyle = findMatchingRuleStyle(input.value, field, input.rules ?? [])
  if (ruleStyle) Object.assign(style, ruleStyle)

  const barRule = (input.bars ?? []).find(
    (rule) => rule && typeof rule === 'object' && normalizeField(rule.field) === field,
  )
  if (barRule) {
    const gradient = buildDataBarGradient(input.value, barRule, input.dataBarMax?.[field] ?? 0)
    if (gradient) style.backgroundImage = gradient
  }

  if (!style.backgroundColor && !style.backgroundImage) {
    const scaleRule = (input.scales ?? []).find(
      (rule) => rule && typeof rule === 'object' && normalizeField(rule.field) === field,
    )
    if (scaleRule) {
      const scaleStyle = resolveColorScaleStyle(
        input.value,
        scaleRule,
        input.ranges?.[field] ?? null,
      )
      if (scaleStyle) Object.assign(style, scaleStyle)
    }
  }

  return style
}

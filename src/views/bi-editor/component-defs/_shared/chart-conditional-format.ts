/**
 * 🔑 图表条件着色（预警色）
 *
 * 按数值阈值给数据点覆盖颜色，用于预警 / 异常突出：
 *   - 规则按配置顺序匹配，命中第一条即生效；
 *   - seriesName 为空作用于全部系列，填写后仅作用于同名系列；
 *   - color 为空或规则非法的条目被忽略，不影响原有配色；
 *   - 数据项支持 number / 数字字符串 / 数组（取最后一项，如散点 [x, y]）/ 对象（value）；
 *   - 全部为纯函数，不依赖 Vue 与 ECharts 实例，便于单测。
 */

export type ChartConditionalOperator =
  'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'between' | 'contains'

/** 规则来自属性面板的 table 编辑器，字段类型按 unknown 处理 */
export interface ChartConditionalRule {
  seriesName?: unknown
  operator?: unknown
  value?: unknown
  value2?: unknown
  color?: unknown
}

export interface ChartConditionalConfig {
  show?: unknown
  rules?: unknown
}

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

/** 数据项的实际数值：对象取 value、数组取最后一项（兼容散点的 [x, y]） */
export function resolveDataItemNumber(item: unknown): number | null {
  if (item === null || item === undefined) return null
  if (Array.isArray(item)) {
    for (let i = item.length - 1; i >= 0; i -= 1) {
      const num = toFiniteNumber(item[i])
      if (num !== null) return num
    }
    return null
  }
  if (typeof item === 'object') {
    return resolveDataItemNumber((item as Record<string, unknown>).value)
  }
  return toFiniteNumber(item)
}

/** 判断数据值是否命中规则（数值优先；contains 按字符串包含） */
export function matchesChartConditionalRule(value: unknown, rule: ChartConditionalRule): boolean {
  const operator = String(rule.operator ?? '') as ChartConditionalOperator
  if (!operator) return false

  if (operator === 'contains') {
    if (value === null || value === undefined) return false
    return String(value).includes(String(rule.value ?? ''))
  }

  const actual = toFiniteNumber(value)
  const target = toFiniteNumber(rule.value)
  if (actual === null || target === null) return false

  if (operator === 'between') {
    const upper = toFiniteNumber(rule.value2)
    if (upper === null) return false
    return actual >= Math.min(target, upper) && actual <= Math.max(target, upper)
  }

  switch (operator) {
    case 'gt':
      return actual > target
    case 'gte':
      return actual >= target
    case 'lt':
      return actual < target
    case 'lte':
      return actual <= target
    case 'eq':
      return actual === target
    case 'ne':
      return actual !== target
    default:
      return false
  }
}

/** 规则是否作用于指定系列：系列名为空表示全部系列 */
function ruleMatchesSeries(rule: ChartConditionalRule, seriesName: string): boolean {
  const target = String(rule.seriesName ?? '').trim()
  return !target || target === seriesName
}

/**
 * 解析数据点命中的颜色；无命中 / 未配置颜色返回 null。
 * 规则顺序优先，第一条命中且带颜色的规则生效。
 */
export function resolveConditionalColor(
  value: unknown,
  seriesName: string,
  rules: ChartConditionalRule[],
): string | null {
  const name = String(seriesName ?? '')
  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') continue
    if (!ruleMatchesSeries(rule, name)) continue
    const color = typeof rule.color === 'string' ? rule.color.trim() : ''
    if (!color) continue
    if (matchesChartConditionalRule(value, rule)) return color
  }
  return null
}

/**
 * 给单个系列的数据点附加 itemStyle.color。
 * 未命中任何规则时返回原数组引用，避免不必要的数据重建与重渲染。
 */
export function applyConditionalColorsToData(
  data: unknown[],
  seriesName: string,
  rules: ChartConditionalRule[],
): unknown[] {
  let changed = false

  const next = data.map((item) => {
    const value = resolveDataItemNumber(item)
    if (value === null) return item
    const color = resolveConditionalColor(value, seriesName, rules)
    if (!color) return item
    changed = true

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>
      const itemStyle = obj.itemStyle && typeof obj.itemStyle === 'object' ? obj.itemStyle : {}
      return { ...obj, itemStyle: { ...(itemStyle as Record<string, unknown>), color } }
    }
    return { value: item, itemStyle: { color } }
  })

  return changed ? next : data
}

/**
 * 遍历 option.series 应用条件着色（原地修改 option）。
 * 只处理有 data 数组的系列；饼图/柱图/散点等按数据点生效，折线作用于拐点。
 */
export function applyChartConditionalFormat(
  option: { series?: unknown },
  config: ChartConditionalConfig,
): void {
  if (!config?.show) return
  const rules = Array.isArray(config.rules) ? (config.rules as ChartConditionalRule[]) : []
  if (rules.length === 0) return

  const seriesList = Array.isArray(option.series)
    ? option.series
    : option.series
      ? [option.series]
      : []

  for (const series of seriesList) {
    if (!series || typeof series !== 'object') continue
    const target = series as { name?: unknown; data?: unknown }
    if (!Array.isArray(target.data) || target.data.length === 0) continue
    target.data = applyConditionalColorsToData(target.data, String(target.name ?? ''), rules)
  }
}

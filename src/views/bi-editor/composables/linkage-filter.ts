/**
 * 联动 / 钻取 / 全局筛选 —— 行过滤纯函数
 *
 * 设计原则:
 *   - 字段不存在于数据行时忽略该条件，避免筛选器误伤不含该字段的数据集。
 *   - 全局筛选器 key 支持 `${field}_start` / `${field}_end` 日期区间，值支持逗号分隔多选。
 *   - 联动/钻取按字符串等值匹配；多条条件之间为 AND。
 *   - 纯函数，不依赖 Pinia / Vue，便于单测。
 */

export type FilterPrimitive = string | number | null

/** 图表联动筛选: 点击源图表后产生的维度值过滤 */
export interface LinkFilter {
  sourceId: string
  sourceName?: string
  field: string
  value: string
}

/** 钻取层级: 组件内逐层下钻的维度值过滤 */
export interface DrillFilter {
  field: string
  value: string
}

export interface RowFilterContext {
  globalFilters?: Record<string, FilterPrimitive>
  linkFilters?: LinkFilter[]
  drillFilters?: DrillFilter[]
  /** 当前组件 ID: 联动筛选时排除源组件自身 */
  componentId?: string
}

type Row = Record<string, unknown>

function hasField(row: Row, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(row, field)
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/** 单条全局筛选器匹配: null = 不约束, true = 保留, false = 过滤掉 */
function matchGlobalFilter(row: Row, key: string, value: FilterPrimitive): boolean | null {
  if (value === null || value === undefined || value === '') return null
  if (!hasField(row, key)) return null
  const cell = cellToString(row[key])
  const target = cellToString(value)
  if (target.includes(',')) {
    return target
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(cell)
  }
  return cell === target
}

/** 应用联动/钻取/全局筛选 */
export function applyRowFilters(rows: Row[], ctx: RowFilterContext): Row[] {
  const globalFilters = ctx.globalFilters ?? {}
  const linkFilters = (ctx.linkFilters ?? []).filter((f) => f.sourceId !== ctx.componentId)
  const drillFilters = ctx.drillFilters ?? []

  const globalEntries = Object.entries(globalFilters)
  if (globalEntries.length === 0 && linkFilters.length === 0 && drillFilters.length === 0) {
    return rows
  }

  // 拆分直接等值条件与日期区间条件
  const directEntries: [string, FilterPrimitive][] = []
  const dateRanges = new Map<string, { start?: string; end?: string }>()
  for (const [key, value] of globalEntries) {
    if (key.endsWith('_start') || key.endsWith('_end')) {
      if (value === null || value === undefined || value === '') continue
      const base = key.slice(0, key.lastIndexOf('_'))
      if (!base) continue
      const range = dateRanges.get(base) ?? {}
      if (key.endsWith('_start')) range.start = String(value)
      else range.end = String(value)
      dateRanges.set(base, range)
    } else {
      directEntries.push([key, value])
    }
  }

  return rows.filter((row) => {
    for (const [key, value] of directEntries) {
      if (matchGlobalFilter(row, key, value) === false) return false
    }
    for (const [field, range] of dateRanges) {
      if (!hasField(row, field)) continue
      const cell = cellToString(row[field])
      if (range.start && cell < range.start) return false
      if (range.end && cell > range.end) return false
    }
    for (const filter of drillFilters) {
      if (!hasField(row, filter.field)) continue
      if (cellToString(row[filter.field]) !== filter.value) return false
    }
    for (const filter of linkFilters) {
      if (!hasField(row, filter.field)) continue
      if (cellToString(row[filter.field]) !== filter.value) return false
    }
    return true
  })
}

import type { ComponentDefinition, PropField } from './props'
import { ECHARTS_DEFAULT_PALETTE } from './options'

/**
 * 🔑 从 propsSchema 自动派生 defaultProps。
 *   遍历 schema 中每个字段的 default 值，合并 extraDefaults。
 *   这样默认值只在 schema 的 field.default 中声明一次，消除重复。
 */
export function deriveDefaultProps(
  schema: PropField[],
  extra?: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const field of schema) {
    result[field.key] = field.default
  }
  return { ...result, ...extra }
}

/**
 * 🔑 性能优化:按 ComponentDefinition 引用缓存 deriveDefaultProps 结果。
 *
 *   schema defaults 是静态值(组件定义在运行时不变),但 9 个图表 Widget 的
 *   getChartSpecificOption 每次构 option 都会调用 deriveDefaultProps 重新遍历 schema。
 *   对于 50 个图表同时刷新数据触发 RAF option build,就是 50 次 schema 遍历/帧。
 *
 *   WeakMap 以 def 为 key,def 在 registry 中是稳定引用,缓存命中率高。
 *   返回的是缓存对象的浅拷贝(与 deriveDefaultProps 行为一致),外部修改不影响缓存。
 *
 *   注意:此函数仅适用于"只读 schema defaults"的场景(如 Widget option 构建);
 *   createComponent 路径仍走 deriveDefaultProps + buildInitialSeriesStyles,不使用此缓存。
 */
const deriveDefaultPropsCache = new WeakMap<
  { propsSchema: PropField[]; extraDefaults?: Record<string, any> },
  Record<string, any>
>()
export function deriveDefaultPropsCached(
  def: { propsSchema: PropField[]; extraDefaults?: Record<string, any> } | undefined,
): Record<string, any> {
  if (!def) return {}
  const cached = deriveDefaultPropsCache.get(def)
  if (cached) return { ...cached }
  const result = deriveDefaultProps(def.propsSchema, def.extraDefaults)
  deriveDefaultPropsCache.set(def, result)
  return { ...result }
}

/**
 * 🔑 从当前 props 中的真实数据（series / pieData）+ seriesStyles 的列定义，
 *   生成"每个数据项一行空样式"的初始 seriesStyles，保证 seriesStyles 与真实数据一一对应。
 *   规则：
 *     1) 如果 schema 中没有 seriesStyles 字段 → 返回 undefined
 *     2) 如果 props.seriesStyles 已经有内容（用户自己编辑过）→ 保留原内容不覆盖
 *     3) 如果 seriesStyles 列为空，根据图表类型取真实数据源：
 *        - 饼图 pie-chart：取 props.pieData 里的每个 name
 *        - 其他带轴图表：取 props.series 里的每个 name
 *     4) 每一行：第一列（通常是 seriesName / name）填真实 name；其余列按其 type 给合理默认空值
 */
export function buildInitialSeriesStyles(
  def: ComponentDefinition,
  props: Record<string, any>,
): any[] | undefined {
  const seriesField = def.propsSchema.find((f) => f.key === 'seriesStyles' && f.type === 'table')
  if (!seriesField || !seriesField.columns || seriesField.columns.length === 0) return undefined

  // 用户已经手动配置过（或旧数据保留）—— 直接用，不覆盖
  if (Array.isArray(props.seriesStyles) && props.seriesStyles.length > 0) {
    return props.seriesStyles
  }

  // 🔑 列元信息
  const columns = seriesField.columns
  const nameCol = columns[0]
  const valueCols = columns.slice(1)

  // 🔑 从 props 中拿到真实数据项列表（饼图走 pieData，其他走 series）
  let dataItems: { name?: string; value?: any; [k: string]: any }[] = []
  if (def.type === 'pie-chart') {
    dataItems = Array.isArray(props.pieData) ? props.pieData : []
  } else {
    dataItems = Array.isArray(props.series) ? props.series : []
  }

  // 🔑 为每个真实数据项生成一行空样式
  return dataItems.map((item, i) => {
    const row: Record<string, any> = {}
    // 名称列：取真实 name
    row[nameCol.key] = String(item?.name ?? '')
    // 其余列：按列类型填默认空值
    for (const col of valueCols) {
      switch (col.type) {
        case 'input':
          row[col.key] = ''
          break
        case 'number':
          row[col.key] = typeof col.min === 'number' ? col.min : 0
          break
        case 'colorpicker':
          // 🔑 颜色列默认值：按 index 从 ECharts 标准调色板循环取
          row[col.key] = ECHARTS_DEFAULT_PALETTE[i % ECHARTS_DEFAULT_PALETTE.length]
          break
        case 'switch':
          row[col.key] = false
          break
        case 'select':
          row[col.key] = col.options?.[0]?.value ?? ''
          break
        default:
          row[col.key] = ''
      }
    }
    return row
  })
}

/**
 * 🔑 评估 visibleWhen 条件，决定字段是否应该显示。
 */
export function isFieldVisible(field: PropField, props: Record<string, any>): boolean {
  if (!field.visibleWhen) return true
  const { field: depKey, equals, in: inValues, truthy } = field.visibleWhen
  const depValue = props?.[depKey]
  if (equals !== undefined) return depValue === equals
  if (inValues !== undefined) return inValues.includes(depValue)
  if (truthy !== undefined) return !!depValue === truthy
  return true
}

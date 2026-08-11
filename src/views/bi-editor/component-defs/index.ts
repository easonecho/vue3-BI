import type { ComponentDefinition } from './types'
import { deriveDefaultProps, buildInitialSeriesStyles } from './types'
import { rawDefinitions, componentDefinitions } from './registry'

export { rawDefinitions, componentDefinitions } from './registry'

/**
 * 🔑 组件定义注册表 — 每个组件类型的单一真相源。
 *
 * 新增组件只需 2 步：
 *   1. 在 component-defs/<type>/ 下创建 index.ts（导出 definition + 引用 Widget.vue）
 *   2. 在同目录下创建 Widget.vue（渲染组件，props 为 { comp: ComponentInstance }）
 *
 * 其他全部自动派生：
 *   - rawDefinitions / componentDefinitions：由 registry.ts 用 import.meta.glob 自动扫描
 *   - getDefaultProps()：从 definition.propsSchema[].default + extraDefaults 自动派生 → 自动补齐 seriesStyles
 *   - CATEGORY_GROUPS / CATEGORY_LABELS：按 category 自动分组
 *   - metadata / widgetRegistry：外部消费者（stores、LeftPanel、ComponentRenderer）直接 import 本文件
 */

/** 🔑 defaultProps 计算缓存：避免每次 createComponent 时重复遍历 Schema */
const defaultPropsCache = new Map<string, Record<string, any>>()

/** 🔑 从 definition 派生完整的 defaultProps（schema defaults + extraDefaults）。
 *   消费者（如 use-components.ts createComponent）调用此函数获取初始 props。
 *   对图表组件：当 seriesStyles 为空数组时，根据真实 series/pieData 数据自动生成每行"空样式行"，
 *   确保系列数量与默认数据一致，用户无需手动新建行。
 */
export function getDefaultProps(type: string): Record<string, any> {
  // 命中缓存：直接返回深拷贝，避免外部修改污染缓存
  if (defaultPropsCache.has(type)) {
    return structuredClone(defaultPropsCache.get(type)!)
  }

  const def = componentDefinitions[type]
  if (!def) return {}

  const baseProps = deriveDefaultProps(def.propsSchema, def.extraDefaults)
  const initialStyles = buildInitialSeriesStyles(def, baseProps)
  if (initialStyles !== undefined) {
    baseProps.seriesStyles = initialStyles
  }

  // 首次计算后写入缓存
  defaultPropsCache.set(type, baseProps)
  return structuredClone(baseProps)
}

/** 清除指定类型或全部类型的 defaultProps 缓存（用于热更新或动态 schema 变更） */
export function invalidateDefaultPropsCache(type?: string): void {
  if (type) {
    defaultPropsCache.delete(type)
  } else {
    defaultPropsCache.clear()
  }
}

/** 分类分组 */
export const CATEGORY_GROUPS: Record<string, ComponentDefinition[]> = {
  basic: rawDefinitions.filter((d) => d.meta.category === 'basic'),
  chart: rawDefinitions.filter((d) => d.meta.category === 'chart'),
  data: rawDefinitions.filter((d) => d.meta.category === 'data'),
  info: rawDefinitions.filter((d) => d.meta.category === 'info'),
}

/** 分类名称映射 */
export const CATEGORY_LABELS: Record<string, string> = {
  basic: '基础组件',
  chart: '图表组件',
  data: '数据组件',
  info: '信息组件',
}

/** 按类型查找 definition */
export function getDefinition(type: string): ComponentDefinition | undefined {
  return componentDefinitions[type]
}

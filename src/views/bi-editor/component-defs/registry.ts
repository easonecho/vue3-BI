import type { Component } from 'vue'
import type { ComponentDefinition } from './types'

/**
 * 🔑 自动扫描注册：通过 import.meta.glob 扫描 ./* /index.ts（排除 _shared）
 *   新增组件只需创建文件夹（type/index.ts + Widget.vue），无需手动改 index.ts
 */
const rawModules = import.meta.glob('./*/index.ts', { eager: true }) as Record<string, any>

export const rawDefinitions: ComponentDefinition[] = Object.entries(rawModules)
  .filter(([path]) => !path.includes('/_shared/'))
  .map(([, mod]) => {
    // 兼容 default 导出 和 命名导出（如 textDefinition）
    const def =
      mod.default ?? Object.values(mod).find((v: any) => v && v.type && v.meta && v.propsSchema)
    return def as ComponentDefinition
  })
  .filter(Boolean)

/** 按 type 建立索引，供快速查找 */
export const componentDefinitions: Record<string, ComponentDefinition> = Object.fromEntries(
  rawDefinitions.map((d) => [d.type, d])
)

/**
 * 🔑 P2-2 插件 SDK: 运行时注册外部组件
 *   由 window.BI.registerComponent(def) 调用 (见 src/plugins/plugin-sdk.ts)。
 *   要求: 必须在 app.mount 之前完成注册, 否则左侧组件面板分组不会刷新。
 */
export function registerComponentDefinition(def: ComponentDefinition): boolean {
  const type = String(def?.type ?? '').trim()
  if (
    !type ||
    !def?.meta ||
    !def?.widget ||
    !Array.isArray(def?.propsSchema)
  ) {
    throw new Error('[BI Plugin] 组件定义不完整: 需要 type / meta / widget / propsSchema')
  }
  if (componentDefinitions[type]) {
    console.warn(`[BI Plugin] 组件类型 "${type}" 已存在, 已跳过注册`)
    return false
  }
  const normalized = { ...def, type: type as ComponentDefinition['type'] }
  rawDefinitions.push(normalized)
  componentDefinitions[type] = normalized
  return true
}

/**
 * 🔑 预加载组件 widget chunk（用于拖拽栏 hover 时提前加载）。
 *
 * 对同步组件无效果；对 defineAsyncComponent 定义的异步组件，
 * 会提前触发 webpack/vite 的 chunk 加载，消除拖拽时的网络等待。
 *
 */
export function preloadComponent(type: string): void {
  const def = componentDefinitions[type]
  if (!def?.widget) return

  // 🔑 defineAsyncComponent 内部暴露的加载器（未在 Vue 公开类型中声明）
  const w = def.widget as Component & { __asyncLoader?: () => void }
  if (typeof w.__asyncLoader === 'function') {
    w.__asyncLoader()
  }
}

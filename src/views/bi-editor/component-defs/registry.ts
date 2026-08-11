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
  rawDefinitions.map((d) => [d.type, d]),
)

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

  const w = def.widget as any
  // Vue 3 defineAsyncComponent 内部暴露的加载器
  if (typeof w.__asyncLoader === 'function') {
    w.__asyncLoader()
  }
}

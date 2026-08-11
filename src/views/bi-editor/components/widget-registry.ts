import type { Component } from 'vue'
import type { ComponentType } from '@/views/bi-editor/types'
import { componentDefinitions } from '@/views/bi-editor/component-defs'

/**
 * 🔑 兼容层：从 component-defs 派生 widgetRegistry。
 *   新代码应直接使用 component-defs，这里仅保留给旧消费者。
 *   已兼容异步组件（defineAsyncComponent），并提供预加载能力。
 */
export const WIDGET_REGISTRY: Record<ComponentType, Component> = Object.fromEntries(
  Object.values(componentDefinitions).map((def) => [def.type, def.widget]),
) as Record<ComponentType, Component>

const FallbackWidget = componentDefinitions['text']?.widget as Component

/** 根据组件类型获取对应 widget 组件 */
export function getWidgetComponent(type: ComponentType): Component {
  return WIDGET_REGISTRY[type] || FallbackWidget
}

/**
 * 🔑 预加载指定类型的 widget 组件 chunk。
 *
 * 建议在拖拽栏的 @mouseenter 事件中调用，实现"悬停即预加载"，
 * 这样用户真正开始拖拽时，chunk 已经加载完毕。
 */
export function preloadWidgetComponent(type: ComponentType): void {
  const widget = WIDGET_REGISTRY[type]
  if (!widget) return

  const w = widget as any
  if (typeof w.__asyncLoader === 'function') {
    w.__asyncLoader()
  }
}

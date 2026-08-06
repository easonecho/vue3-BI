import type { Component } from 'vue'
import type { ComponentType } from '@/views/bi-editor/types'
import { componentDefinitions } from '@/views/bi-editor/component-defs'

/**
 * 🔑 兼容层：从 component-defs 派生 widgetRegistry。
 *   新代码应直接使用 component-defs，这里仅保留给旧消费者。
 */
export const WIDGET_REGISTRY: Record<ComponentType, Component> = Object.fromEntries(
  Object.values(componentDefinitions).map((def) => [def.type, def.widget]),
) as Record<ComponentType, Component>

const FallbackWidget = componentDefinitions['text']?.widget as Component

/** 根据组件类型获取对应 widget 组件 */
export function getWidgetComponent(type: ComponentType): Component {
  return WIDGET_REGISTRY[type] || FallbackWidget
}

import type { ComponentMeta, ComponentType } from '@/views/bi-editor/types'
import {
  componentDefinitions,
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  getDefaultProps,
} from '@/views/bi-editor/component-defs'

/**
 * 🔑 兼容层：从 component-defs 派生 metadata。
 *   新代码应直接使用 component-defs，这里仅保留给旧消费者。
 */
export const COMPONENT_META: Record<ComponentType, ComponentMeta> = Object.fromEntries(
  Object.values(componentDefinitions).map((def) => [
    def.type,
    {
      type: def.type,
      name: def.meta.name,
      category: def.meta.category,
      icon: def.meta.icon,
      defaultWidth: def.meta.defaultWidth,
      defaultHeight: def.meta.defaultHeight,
      // 🔑 defaultProps 从 schema 自动派生，不再从 def.defaultProps 读取
      defaultProps: getDefaultProps(def.type),
      defaultStyle: def.defaultStyle || {},
    },
  ]),
) as Record<ComponentType, ComponentMeta>

export { CATEGORY_GROUPS, CATEGORY_LABELS }

export function getMeta(type: ComponentType): ComponentMeta | undefined {
  return COMPONENT_META[type]
}

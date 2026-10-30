import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import type { ComponentIndexApi, OpsDeps } from './types'

/**
 * 🔑 组件索引：O(1) 按 id 查找 + 选中派生状态。
 *   componentMap 只在数组引用变化时重建（push/splice/replace），
 *   拖拽期间原地修改 x/y 不触发重建。
 */
export function createComponentIndex(deps: OpsDeps): ComponentIndexApi {
  const { components, selectedId, selectedIds } = deps

  // 🔑 性能优化：computed Map 索引，O(1) 按 id 查找组件。
  //   只在数组引用变化时重建（push/splice/replace），拖拽期间原地修改 x/y 不触发重建。
  const componentMap = computed(() => {
    const m = new Map<string, ComponentInstance>()
    for (const c of components.value) m.set(c.id, c)
    return m
  })

  /** O(1) 获取组件实例（热路径替代 find） */
  function getComponent(id: string): ComponentInstance | undefined {
    return componentMap.value.get(id)
  }

  const selectedComponent = computed(
    () => componentMap.value.get(selectedId.value ?? '') ?? null,
  )

  // 🔑 O(1) 选中 ID 查找：供 CanvasArea v-for 中 :multi-selected 使用
  //   替代 selectedIds.includes(comp.id) 的 O(N×M) 线性扫描
  const selectedIdSet = computed(() => new Set(selectedIds.value))

  const selectedComponents = computed(() => {
    const ids = selectedIds.value
    if (ids.length === 0) {
      if (!selectedId.value) return []
      const c = componentMap.value.get(selectedId.value)
      return c ? [c] : []
    }
    // 🔑 用 Set 替代 includes，O(n*m) → O(n)
    const idSet = new Set(ids)
    return components.value
      .filter((c) => idSet.has(c.id))
      .sort((a, b) => b.zIndex - a.zIndex)
  })

  const layerList = computed(() => [...components.value].sort((a, b) => b.zIndex - a.zIndex))

  return {
    componentMap,
    getComponent,
    selectedComponent,
    selectedIdSet,
    selectedComponents,
    layerList,
  }
}

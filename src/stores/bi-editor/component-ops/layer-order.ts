import { computed } from 'vue'
import type { ComponentIndexApi, OpsDeps } from './types'

/**
 * 🔑 层级（zIndex）操作。
 *   - 禁用状态：只有一个组件时全部禁用；已在最顶层/最底层时对应按钮禁用
 *   - bringToFront / sendToBack 保持其余组件的相对顺序（整体移一格）
 */
export function createLayerOrder(deps: OpsDeps, index: ComponentIndexApi) {
  const { components, pushHistory } = deps
  const { getComponent, selectedComponent } = index

  // 🔑 层级操作禁用状态：
  //   - 只有一个组件时所有操作均禁用
  //   - 组件在最顶层时 canBringToFront/canMoveUp 禁用
  const maxZ = computed(() =>
    components.value.length > 0 ? Math.max(...components.value.map((c) => c.zIndex)) : 0,
  )
  const minZ = computed(() =>
    components.value.length > 0 ? Math.min(...components.value.map((c) => c.zIndex)) : 0,
  )
  const canBringToFront = computed(
    () =>
      !!selectedComponent.value &&
      components.value.length > 1 &&
      selectedComponent.value.zIndex < maxZ.value,
  )
  const canSendToBack = computed(
    () =>
      !!selectedComponent.value &&
      components.value.length > 1 &&
      selectedComponent.value.zIndex > minZ.value,
  )
  const canMoveUp = computed(() => canBringToFront.value)
  const canMoveDown = computed(() => canSendToBack.value)

  function setComponentZIndex(id: string, zIndex: number) {
    const comp = getComponent(id)
    if (comp) {
      comp.zIndex = zIndex
      pushHistory()
    }
  }

  function bringToFront(id: string) {
    const comp = getComponent(id)
    if (!comp) return
    // 🔑 保持相对顺序：目标组件移到最顶层，其余组件整体下移一格。
    //   例：[1,2,3,4,5,6] 把 1 置顶 → [2,3,4,5,6,1]（而非 [6,2,3,4,5,1]）
    const others = components.value.filter((c) => c.id !== id).sort((a, b) => a.zIndex - b.zIndex)
    if (others.length === 0) return
    const maxOtherZ = others[others.length - 1].zIndex
    if (comp.zIndex > maxOtherZ) return // 已经在最顶层
    // 其余组件整体下移 1 格（保持相对顺序），目标组件占据原最高位
    others.forEach((c) => {
      c.zIndex -= 1
    })
    comp.zIndex = maxOtherZ
    pushHistory()
  }

  function sendToBack(id: string) {
    const comp = getComponent(id)
    if (!comp) return
    // 🔑 保持相对顺序：目标组件移到最底层，其余组件整体上移一格。
    //   例：[1,2,3,4,5,6] 把 6 置底 → [6,1,2,3,4,5]（而非 [6,2,3,4,5,1]）
    const others = components.value.filter((c) => c.id !== id).sort((a, b) => a.zIndex - b.zIndex)
    if (others.length === 0) return
    const minOtherZ = others[0].zIndex
    if (comp.zIndex < minOtherZ) return // 已经在最底层
    // 其余组件整体上移 1 格（保持相对顺序），目标组件占据原最低位
    others.forEach((c) => {
      c.zIndex += 1
    })
    comp.zIndex = minOtherZ
    pushHistory()
  }

  function moveUp(id: string) {
    const comp = getComponent(id)
    if (!comp) return
    // 🔑 找到 z-index 比当前组件大的最小组件（上一层），互换 zIndex
    const upperComps = components.value.filter((c) => c.zIndex > comp.zIndex)
    if (upperComps.length === 0) return
    const nextUpper = upperComps.reduce(
      (min, c) => (c.zIndex < min.zIndex ? c : min),
      upperComps[0],
    )
    const temp = comp.zIndex
    comp.zIndex = nextUpper.zIndex
    nextUpper.zIndex = temp
    pushHistory()
  }

  function moveDown(id: string) {
    const comp = getComponent(id)
    if (!comp) return
    // 🔑 找到 z-index 比当前组件小的最大组件（下一层），互换 zIndex
    const lowerComps = components.value.filter((c) => c.zIndex < comp.zIndex)
    if (lowerComps.length === 0) return
    const nextLower = lowerComps.reduce(
      (max, c) => (c.zIndex > max.zIndex ? c : max),
      lowerComps[0],
    )
    const temp = comp.zIndex
    comp.zIndex = nextLower.zIndex
    nextLower.zIndex = temp
    pushHistory()
  }

  return {
    maxZ,
    minZ,
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
    setComponentZIndex,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
  }
}

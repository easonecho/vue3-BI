import type { ComponentIndexApi, OpsDeps } from './types'

/**
 * 🔑 选中操作：
 *   - selectComponent：单选，点组内任一成员整组选中（锁定成员跳过）
 *   - selectComponentAccum：Shift+Click 累加（toggle=true 时移除）
 *   - selectByRect：框选（additive=Shift 拖拽）
 *   - clearSelection：清空单选 + 多选集合
 */
export function createSelection(
  deps: OpsDeps,
  index: ComponentIndexApi,
  expandGroup: (id: string) => string[],
) {
  const { components, selectedId, selectedIds } = deps
  const { getComponent } = index

  function selectComponent(id: string | null) {
    // 🔑 锁定组件：直接忽略选中（locked 状态阻止被单/多选）
    if (id) {
      const target = getComponent(id)
      if (target?.locked) return
    }
    selectedId.value = id
    // 🔑 单选时清空 selectedIds（Shift+Click / 框选会再填充它）
    const next: string[] = []
    if (id) {
      // 🔑 若点的是分组内的组件，整组选中（锁定成员会被跳过）
      expandGroup(id)
        .filter((gid) => !getComponent(gid)?.locked)
        .forEach((gid) => { if (!next.includes(gid)) next.push(gid) })
    }
    selectedIds.value = next
  }

  /**
   * 🔑 Shift+Click 累加选中：
   *   - toggle=false：目标组件加入集合（保持已有选中）
   *   - toggle=true：目标组件若已在集合中则移除（Ctrl+Click 语义）
   *   - 若点击成员属于分组：按"整组"粒度 add/remove
   */
  function selectComponentAccum(id: string, toggle = false) {
    // 🔑 锁定组件：忽略
    const target = getComponent(id)
    if (target?.locked) return
    const next = [...selectedIds.value]
    // 🔑 若 selectedIds 为空但 selectedId 存在（之前是单选），把已选中的组件也纳入（锁定项会被过滤掉，不重复 add）
    if (next.length === 0 && selectedId.value && selectedId.value !== id) {
      expandGroup(selectedId.value)
        .filter((gid) => !getComponent(gid)?.locked)
        .forEach((gid) => { if (!next.includes(gid)) next.push(gid) })
    }
    const groupIds = expandGroup(id).filter(
      (gid) => !getComponent(gid)?.locked,
    )
    if (groupIds.length === 0) return
    const wasAllIn = groupIds.every((gid) => next.includes(gid))
    if (wasAllIn && toggle) {
      // 移除该组所有成员
      selectedIds.value = next.filter((gid) => !groupIds.includes(gid))
    } else {
      // 加入该组所有成员（去重）
      groupIds.forEach((gid) => { if (!next.includes(gid)) next.push(gid) })
      selectedIds.value = next
    }
    // 🔑 更新主选中为最后点击的组件
    selectedId.value = id
  }

  /**
   * 🔑 框选：按画布坐标系矩形选择组件。
   *   - rect：以 canvas-sheet 左上角为原点的世界坐标矩形
   *   - additive：是否累加模式（Shift 拖拽）
   */
  function selectByRect(
    rect: { x: number; y: number; width: number; height: number },
    additive = false,
  ) {
    // 🔑 性能优化：用 Set 替代数组 includes，消除循环内 O(N) 查找 → 整体从 O(N²) 降到 O(N)
    //   100 个组件时从 10000 次比较降到 100 次
    const nextSet: Set<string> = additive ? new Set(selectedIds.value) : new Set()
    const left = Math.min(rect.x, rect.x + rect.width)
    const right = Math.max(rect.x, rect.x + rect.width)
    const top = Math.min(rect.y, rect.y + rect.height)
    const bottom = Math.max(rect.y, rect.y + rect.height)
    let maxZ = -Infinity
    let masterId = ''
    for (const c of components.value) {
      if (!c.visible || c.locked) continue
      const cR = c.x + c.width
      const cB = c.y + c.height
      if (c.x < right && cR > left && c.y < bottom && cB > top) {
        nextSet.add(c.id)
        // 🔑 同时计算主选中（z-index 最高），避免二次遍历
        if (c.zIndex > maxZ) {
          maxZ = c.zIndex
          masterId = c.id
        }
      }
    }
    const next = [...nextSet]
    // 🔑 性能优化：比较新旧选中集合，相同则跳过赋值，避免无谓的响应式触发。
    //   框选期间 mousemove 频率高，若每次都赋值新数组（即使内容相同），
    //   会让 selectedIdSet computed 重算 + v-memo 数组比较 + 100 个组件 patch 检查。
    const prev = selectedIds.value
    const newMaster = next.length > 0 ? masterId || null : null
    if (prev.length !== next.length || !next.every((id, i) => id === prev[i])) {
      selectedIds.value = next
      selectedId.value = newMaster
    } else if (selectedId.value !== newMaster) {
      // 集合相同但主选中可能变化（z-index 顺序）
      selectedId.value = newMaster
    }
  }

  /** 🔑 清空所有选中（单选 + 多选集合） */
  function clearSelection() {
    selectedId.value = null
    selectedIds.value = []
  }

  return {
    selectComponent,
    selectComponentAccum,
    selectByRect,
    clearSelection,
  }
}

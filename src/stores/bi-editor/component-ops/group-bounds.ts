import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import type { ComponentIndexApi, GroupBounds, OpsDeps } from './types'

/**
 * 🔑 选中分组的包围盒 & 命中测试 & 分组展开。
 *   - selectedGroupBounds：统一 GroupBox 边框的渲染来源
 *   - hitTestSelectedGroupBlank：组内空白区域的整体拖拽入口
 *   - expandGroup：点组内任一成员即整组选中
 */
export function createGroupBounds(deps: OpsDeps, index: ComponentIndexApi) {
  const { components, selectedId, selectedIds } = deps
  const { getComponent, componentMap } = index

  /** 🔑 把组件按 groupId 分组（用于计算包围盒） */
  const existingGroups = computed(() => {
    const map = new Map<string, ComponentInstance[]>()
    for (const c of components.value) {
      if (!c.groupId) continue
      const arr = map.get(c.groupId) ?? []
      arr.push(c)
      map.set(c.groupId, arr)
    }
    return map
  })

  /** 🔑 哪些 groupId 是「选中的分组」（只要组内任一员被选中就算） */
  const selectedGroupIds = computed(() => {
    const set = new Set<string>()
    const allSelectedIds = new Set<string>()
    for (const id of selectedIds.value) allSelectedIds.add(id)
    if (selectedId.value) allSelectedIds.add(selectedId.value)
    for (const c of components.value) {
      if (allSelectedIds.has(c.id) && c.groupId) set.add(c.groupId)
    }
    return set
  })

  /** 🔑 选中分组的包围盒列表（统一 GroupBox 边框的渲染来源）。
   *
   * 🔑 性能优化：本 computed 不读取 groupDragPreview，避免拖拽期间 setDragPreview
   *   每帧调用导致 selectedGroupBounds 重算（遍历所有分组×所有组员）+ v-for 重渲染。
   *   拖拽期间 comp.x/y 不变（只通过 CSS transform 视觉跟随），所以包围盒尺寸天然稳定。
   *   GroupBox 的视觉跟随由 CanvasArea 的 getGroupBoxStyle 中 transform: translate(dx, dy) 完成，
   *   该函数读取 store.groupDragPreview，只触发 GroupBox div 的 style 更新，不触发本 computed。
   *
   *   历史：旧实现拖拽期间会就地写主体 comp.x/y，导致包围盒每帧抖动，故引入了
   *   "主体减 delta 撤回位移" 的补偿逻辑。当前已改为 transform 预览，comp.x/y 不变，
   *   补偿逻辑变成死代码（且会把主体位置反向偏移），已删除。
   */
  const selectedGroupBounds = computed<GroupBounds[]>(() => {
    const result: GroupBounds[] = []
    for (const [gid, members] of existingGroups.value.entries()) {
      if (!selectedGroupIds.value.has(gid)) continue
      // 🔑 优先用冻结快照：从任一组员身上取 fixedGroupBox（所有组员同值）
      //   若有，则 width/height 冻结不变（对齐/分布不缩框），但 x/y 必须与实际组员整体位移同步
      //     （组员整体被 moveComponent + delta 时，我们在提交时同步加 delta 到冻结值，见 commitGroupDrag）
      //   若该组无冻结值（老项目数据 / 之前创建的组），回退为实时包围盒（兼容模式）
      const frozenFrom = members.find((m) => !!m.fixedGroupBox)
      const ids: string[] = []
      for (const m of members) {
        if (!m.visible) continue
        ids.push(m.id)
      }
      if (ids.length === 0) continue
      if (frozenFrom && frozenFrom.fixedGroupBox) {
        const fb = frozenFrom.fixedGroupBox
        result.push({
          groupId: gid,
          x: fb.x,
          y: fb.y,
          width: fb.width,
          height: fb.height,
          memberIds: ids,
        })
      } else {
        // 兼容路径：老分组无 frozen 值，仍按实时包围盒绘制（行为与之前一致）
        let minX = Infinity
        let minY = Infinity
        let maxR = -Infinity
        let maxB = -Infinity
        for (const m of members) {
          if (!m.visible) continue
          minX = Math.min(minX, m.x)
          minY = Math.min(minY, m.y)
          maxR = Math.max(maxR, m.x + m.width)
          maxB = Math.max(maxB, m.y + m.height)
        }
        result.push({
          groupId: gid,
          x: minX,
          y: minY,
          width: maxR - minX,
          height: maxB - minY,
          memberIds: ids,
        })
      }
    }
    return result
  })

  /** 🔑 判断组件 id 是否属于「当前被选中的分组」——用于 CanvasComponentItem 隐藏个人选中边框 */
  function isInSelectedGroup(id: string): boolean {
    // 🔑 性能优化：用 componentMap 替代 components.value.find，O(N) → O(1)
    //   此函数在 v-memo 数组中对每个组件调用，100 个组件 × find(100) = O(N²) = 10000 次/帧
    //   改用 Map.get 后：100 次 O(1) = O(N) = 100 次/帧
    const c = componentMap.value.get(id)
    if (!c || !c.groupId) return false
    return selectedGroupIds.value.has(c.groupId)
  }

  /**
   * 🔑 命中测试：画布世界坐标是否落在某个选中分组的包围盒内，且该点
   *   **不在任何可见组员矩形之内**（表明点击的是组内空白区域）。
   *   返回 { groupId, masterId }（masterId 用 z-index 最高的组员，作为 moveComponent 的拖拽主体）；否则 null。
   */
  function hitTestSelectedGroupBlank(
    wx: number,
    wy: number,
  ): { groupId: string; masterId: string } | null {
    for (const gb of selectedGroupBounds.value) {
      if (wx < gb.x || wx > gb.x + gb.width || wy < gb.y || wy > gb.y + gb.height) continue
      // 检查：是否命中任何组内可见成员（命中成员→应该由 VDR 处理，不命中→空白区→启动分组整体拖拽）
      let hitMember = false
      for (const mid of gb.memberIds) {
        const m = getComponent(mid)
        if (!m || !m.visible) continue
        if (wx >= m.x && wx <= m.x + m.width && wy >= m.y && wy <= m.y + m.height) {
          hitMember = true
          break
        }
      }
      if (hitMember) return null
      // 取 z-index 最高组员作为"拖拽主体"，保证 moveComponent 能触发 dragPreview 累加
      let masterId = ''
      let maxZ = -Infinity
      for (const mid of gb.memberIds) {
        const m = getComponent(mid)
        if (!m || m.locked) continue
        if (m.zIndex > maxZ) {
          maxZ = m.zIndex
          masterId = mid
        }
      }
      if (!masterId) return null
      return { groupId: gb.groupId, masterId }
    }
    return null
  }

  /** 🔑 分组展开：给定组件 id → 若它有 groupId，返回同组所有未锁定、可见组件的 id 集合 */
  function expandGroup(id: string): string[] {
    const comp = getComponent(id)
    if (!comp || !comp.groupId) return [id]
    return components.value
      .filter((c) => c.groupId === comp.groupId && c.visible)
      .map((c) => c.id)
  }

  return {
    existingGroups,
    selectedGroupIds,
    selectedGroupBounds,
    isInSelectedGroup,
    hitTestSelectedGroupBlank,
    expandGroup,
  }
}

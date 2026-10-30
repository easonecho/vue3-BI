import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import type { OpsDeps } from './types'

/** 🔑 分组 / 取消分组（扁平方案：无独立组节点，groupId + fixedGroupBox 挂在组员身上） */
export function createGroupSelection(
  deps: OpsDeps,
  getAlignTargets: () => ComponentInstance[],
) {
  const { pushHistory } = deps

  /** 至少 2 个组件才可分组 */
  const canGroup = computed(() => {
    const targets = getAlignTargets()
    if (targets.length < 2) return false
    // 只要不是全部已经在同一个组里，就允许分组（提升体验）
    const gids = new Set(targets.map((t) => t.groupId).filter(Boolean))
    return !(gids.size === 1 && targets.every((t) => t.groupId))
  })
  /** 主选中或当前多选中存在分组成员 → 可取消分组 */
  const canUngroup = computed(() => getAlignTargets().some((t) => !!t.groupId))

  function groupSelection() {
    const targets = getAlignTargets()
    if (targets.length < 2) return
    // 🔑 先计算「冻结前」的实际包围盒：以当前所有目标组件的几何边界为准
    //   （不依赖任何历史 frozen 值，保证新分组 100% 反映真实选中范围）
    let minX = Infinity
    let minY = Infinity
    let maxR = -Infinity
    let maxB = -Infinity
    for (const c of targets) {
      if (!c.visible) continue
      minX = Math.min(minX, c.x)
      minY = Math.min(minY, c.y)
      maxR = Math.max(maxR, c.x + c.width)
      maxB = Math.max(maxB, c.y + c.height)
    }
    if (!isFinite(minX)) return // 全部不可见，不分组
    const frozen = { x: minX, y: minY, width: maxR - minX, height: maxB - minY }
    const newGid = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
    for (const c of targets) {
      c.groupId = newGid
      // 🔑 每个组员都存一份冻结快照 —— 扁平分组无独立"组节点"，挂组员身上
      //   所有组员的 fixedGroupBox 值相同（同一 newGid），读取时取第一个非空即可
      c.fixedGroupBox = { ...frozen }
    }
    pushHistory()
  }
  function ungroupSelection() {
    const targets = getAlignTargets()
    const hadGroup = targets.some((c) => !!c.groupId)
    for (const c of targets) {
      c.groupId = undefined
      // 🔑 解除分组同步清冻结快照：再次分组时重新建框
      c.fixedGroupBox = undefined
    }
    if (hadGroup) pushHistory()
  }

  return {
    canGroup,
    canUngroup,
    groupSelection,
    ungroupSelection,
  }
}

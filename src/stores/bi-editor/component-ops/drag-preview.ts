import { nextTick, ref } from 'vue'
import type { ComponentIndexApi, MoveOpts, OpsDeps } from './types'

/**
 * 🔑 拖拽预览 / 移动 / 尺寸变更。
 *
 *   拖拽某个组成员时记录其 groupId + 从拖拽起点开始的累计 delta：
 *   其他组员读 groupDragPreview，通过 CSS transform 视觉跟随；自身 x/y 不动，避免触发
 *   vue3-drag-resize 的 x/y props watcher（watcher 会调用 bodyDown→bodyMove→
 *   $nextTick(bodyUp)，emit 虚假的 dragging/dragstop 事件，dragstop 还会调
 *   pushHistory，N 个组员连锁就是 N 倍开销 + 历史栈污染）。
 *   dragstop 时由 commitGroupDrag 一次性提交 delta 到所有组员，然后清空。
 */
export function createDragPreview(deps: OpsDeps, index: ComponentIndexApi) {
  const { components, markDirty } = deps
  const { getComponent } = index

  const groupDragPreview = ref<{
    groupId: string
    dx: number
    dy: number
    draggedId: string
  } | null>(null)
  /**
   * 🔑 性能优化：当前正在拖拽的主体的 groupId（或 null）。
   *   - setDragPreview 时同步设置（与 groupDragPreview.groupId 同值）
   *   - commitGroupDrag / abortGroupDrag 时重置为 null
   *   - 供 v-memo 早退判断：非同组组件在拖拽期间不 re-patch
   *   ⚠️ 单组件拖拽（无 groupId）时为 null，需要配合 activeDragId 判断主体本身
   */
  const activeDragGroupId = ref<string | null>(null)
  /**
   * 🔑 性能优化：当前正在拖拽的主体 id（或 null）。
   *   - setDragPreview 时同步设置（与 groupDragPreview.draggedId 同值）
   *   - commitGroupDrag / abortGroupDrag 时重置为 null
   *   - 供 v-memo 早退判断：拖拽主体本身必须 re-patch 应用 CSS transform
   *   ⚠️ 必须独立于 activeDragGroupId：单组件拖拽时 groupId 为 null，
   *     若只看 groupId 会让主体组件在 v-memo 中三元恒为 null → 永不 re-patch → 无视觉跟随
   */
  const activeDragId = ref<string | null>(null)

  /**
   * 🔑 防止 commitGroupDrag 期间的 VDR 副作用导致无限循环：
   *   commitGroupDrag 修改其他组员 x/y → 触发 VDR x/y watcher →
   *   bodyDown→bodyMove→$nextTick(bodyUp)→emit dragging/dragstop →
   *   handleVdrDragstop 误以为真实拖拽 → moveComponent → commitGroupDrag →
   *   再次改组员 x/y → ……递归爆栈
   *   此标志在 commit 开始时置 true，nextTick + setTimeout(0) 双保险后回 false，
   *   覆盖 VDR bodyUp 的 nextTick 执行窗口。
   */
  let isCommittingGroupDrag = false
  let commitTimer: ReturnType<typeof setTimeout> | null = null

  function beginCommitGuard() {
    isCommittingGroupDrag = true
    if (commitTimer) clearTimeout(commitTimer)
    commitTimer = setTimeout(() => {
      nextTick(() => {
        isCommittingGroupDrag = false
        commitTimer = null
      })
    }, 0)
  }

  function isCommittingGroupDragNow(): boolean {
    return isCommittingGroupDrag
  }

  function moveComponent(id: string, x: number, y: number, opts: MoveOpts = {}) {
    const comp = getComponent(id)
    if (!comp) return
    const dx = x - comp.x
    const dy = y - comp.y
    comp.x = x
    comp.y = y
    // 🔑 分组联动模式选择（详见 MoveOpts 注释）：
    //   - dragPreview：拖拽时累计 delta 到 groupDragPreview，组员用 CSS transform 跟随
    //   - linkGroup ：同步联动（箭头键等离散场景）
    //   - 都不传：仅移动目标本身（resize、对齐等）
    if (comp.groupId && (opts.dragPreview || opts.linkGroup)) {
      if (opts.dragPreview) {
        // 预览模式：累计 delta，不改写其他组员
        const prev = groupDragPreview.value
        if (!prev || prev.draggedId !== id) {
          // 新拖拽会话：以「这一帧的 delta」作为累计起点（旧实现设为 0 会丢失第一帧位移，
          //   导致组员第一帧 transform=0 而主体已动 → 视觉抖一下 + GroupBox 尺寸闪一下）
          groupDragPreview.value = { groupId: comp.groupId, dx, dy, draggedId: id }
        } else {
          groupDragPreview.value = {
            ...prev,
            dx: prev.dx + dx,
            dy: prev.dy + dy,
          }
        }
      } else {
        // 同步联动：立即把 delta 加到同组其他组员 + 同步更新 fixedGroupBox.x/y
        const gid = comp.groupId
        for (const c of components.value) {
          if (c.id === comp.id || c.locked) continue
          if (c.groupId === gid) {
            c.x += dx
            c.y += dy
          }
        }
        // 🔑 linkGroup 意味着整组被"整体移动"（如方向键），冻结框必须跟随，否则 GroupBox 留原地
        if (dx !== 0 || dy !== 0) {
          for (const c of components.value) {
            if (c.groupId === gid && c.fixedGroupBox) {
              c.fixedGroupBox = { ...c.fixedGroupBox, x: c.fixedGroupBox.x + dx, y: c.fixedGroupBox.y + dy }
            }
          }
        }
      }
    }
    markDirty()
  }

  /**
   * 🔑 拖拽结束：把累计的 delta 一次性应用到所有同组其他组员，然后清空预览。
   *   必须在 pushHistory 之前调用，让历史快照包含所有组员的最终位置。
   *   提交后其他组员的 x/y 变化会触发其 VDR watcher，但调用方已重置 wasDragging，
   *   handleVdrDragstop 会因 wasDragging=false 早退，不会污染历史或重复 pushHistory。
   */
  function commitGroupDrag(id: string) {
    const preview = groupDragPreview.value
    if (!preview || preview.draggedId !== id) {
      groupDragPreview.value = null
      activeDragGroupId.value = null
      activeDragId.value = null
      return
    }
    beginCommitGuard()
    const { groupId, dx, dy, draggedId } = preview
    if (dx !== 0 || dy !== 0) {
      for (const c of components.value) {
        if (c.id === draggedId || c.locked) continue
        if (c.groupId === groupId) {
          c.x += dx
          c.y += dy
        }
      }
      // 🔑 整组被"整体移动"→ 冻结框 x/y 必须同步 +delta，否则 GroupBox 留在原位置
      //   （draggedId 自身 x/y 已在外层 moveComponent 中最终化，但其 fixedGroupBox 未被更新，此处一起补）
      for (const c of components.value) {
        if (c.groupId === groupId && c.fixedGroupBox) {
          c.fixedGroupBox = {
            ...c.fixedGroupBox,
            x: c.fixedGroupBox.x + dx,
            y: c.fixedGroupBox.y + dy,
          }
        }
      }
    }
    groupDragPreview.value = null
    activeDragGroupId.value = null
    activeDragId.value = null
  }

  /** 🔑 拖拽中止/早退路径调用：仅清空预览，不动任何组员位置 */
  function abortGroupDrag() {
    groupDragPreview.value = null
    activeDragGroupId.value = null
    activeDragId.value = null
  }

  /**
   * 🔑 性能优化：拖拽中只更新 CSS transform 预览，不写 comp.x/y。
   *   被拖拽主体和同组组员都通过 CSS transform 视觉跟随，
   *   comp.x/y 保持不变 → 零响应式触发、零模板 re-render、零 VDR watcher 连锁。
   *   dragstop 时由 commitGroupDrag 一次性提交 delta 到组员，再 moveComponent 写最终位置。
   */
  function setDragPreview(
    draggedId: string,
    groupId: string | undefined,
    dx: number,
    dy: number,
  ) {
    groupDragPreview.value = {
      draggedId,
      groupId: groupId ?? '',
      dx,
      dy,
    }
    // 🔑 同步 activeDragGroupId + activeDragId：让 v-memo 早退判断不依赖 groupDragPreview 对象引用变化
    activeDragGroupId.value = groupId ?? null
    activeDragId.value = draggedId
  }

  function resizeComponent(id: string, width: number, height: number) {
    const comp = getComponent(id)
    if (comp) {
      comp.width = width
      comp.height = height
      // 🔑 resizeComponent 不调用 pushHistory（拉伸中高频调用），但仍需标记未保存改动
      markDirty()
    }
  }

  return {
    groupDragPreview,
    activeDragGroupId,
    activeDragId,
    beginCommitGuard,
    isCommittingGroupDragNow,
    moveComponent,
    commitGroupDrag,
    abortGroupDrag,
    setDragPreview,
    resizeComponent,
  }
}

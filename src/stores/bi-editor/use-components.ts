import { computed, nextTick, ref, type Ref } from 'vue'
import type { ComponentInstance, ComponentType } from '@/views/bi-editor/types'
import { getMeta } from './metadata'

/**
 * 🔑 moveComponent 的联动模式：
 *   - undefined / {} ：仅移动目标组件本身，不联动其他组员（resize、对齐等场景）
 *   - { linkGroup: true } ：同步联动 —— 立即把 delta 加到所有非锁定的同组成员 x/y 上
 *     （箭头键微调等"一次性离散移动"场景，N 个组员各触发一次 VDR watcher，
 *      handleVdrDragging 的 delta=0 早退 + handleVdrDragstop 的 wasDragging=false 早退
 *      已经能消化掉虚假事件，开销可接受）
 *   - { dragPreview: true } ：预览联动 —— 不改写其他组员的 x/y，只把累计 delta 记到
 *     groupDragPreview，由组员通过 CSS transform 视觉跟随；dragstop 时调
 *     commitGroupDrag 一次性提交。专用于鼠标拖拽，避免每次 mousemove 触发 N 个
 *     VDR x/y watcher → bodyDown/bodyMove/bodyUp → dragging/dragstop 的连锁。
 */
export interface MoveOpts {
  linkGroup?: boolean
  dragPreview?: boolean
}

/** 🔑 分组包围盒：选中某个分组时，用于绘制统一的 GroupBox 边框 + 空白区域命中拖拽 */
export interface GroupBounds {
  groupId: string
  x: number
  y: number
  width: number
  height: number
  memberIds: string[]
}

/** 组件操作 API（用于类型约束与文档） */
export interface ComponentOperationsApi {
  selectedComponent: ReturnType<typeof computed<ComponentInstance | null>>
  /** 多选：所有选中组件实例数组（按 zIndex 排序） */
  selectedComponents: ReturnType<typeof computed<ComponentInstance[]>>
  layerList: ReturnType<typeof computed<ComponentInstance[]>>
  /** 🔑 选中分组对应的包围盒列表（≥1：选中了 group 才会有） */
  selectedGroupBounds: ReturnType<typeof computed<GroupBounds[]>>
  generateId: () => string
  createComponent: (type: ComponentType, x: number, y: number) => ComponentInstance
  addComponent: (type: ComponentType, x: number, y: number) => ComponentInstance
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void
  moveComponent: (id: string, x: number, y: number, opts?: MoveOpts) => void
  resizeComponent: (id: string, width: number, height: number) => void
  setComponentZIndex: (id: string, zIndex: number) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  moveUp: (id: string) => void
  moveDown: (id: string) => void
  removeComponent: (id: string) => void
  duplicateComponent: (id: string) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  selectComponent: (id: string | null) => void
  /** 多选：累加选中（Shift+Click 用），toggle=true 时若已选中则取消 */
  selectComponentAccum: (id: string, toggle?: boolean) => void
  /** 多选：按矩形框选 */
  selectByRect: (rect: { x: number; y: number; width: number; height: number }, additive?: boolean) => void
  /** 取消所有选中（selectedId = null + selectedIds 清空） */
  clearSelection: () => void
  /** 🔑 拖拽预览：当前正在拖拽的分组信息 + 累计位移（world 坐标） */
  groupDragPreview: Ref<{ groupId: string; dx: number; dy: number; draggedId: string } | null>
  /** 🔑 拖拽中：只更新 CSS transform 预览，不写 comp.x/y（零响应式触发） */
  setDragPreview: (draggedId: string, groupId: string | undefined, dx: number, dy: number) => void
  /** 🔑 拖拽结束：把累计 delta 一次性应用到所有同组其他组员，并清空预览 */
  commitGroupDrag: (id: string) => void
  /** 🔑 拖拽中止/早退：清空预览（不改任何组员位置） */
  abortGroupDrag: () => void
  /** 🔑 O(1) 按 id 获取组件实例（Map 索引，替代 find） */
  getComponent: (id: string) => ComponentInstance | undefined
  /** 🔑 判断组件 id 是否属于「当前被选中的分组」——用于隐藏组员个人选中边框 */
  isInSelectedGroup: (id: string) => boolean
  /** 🔑 命中测试：画布世界坐标是否落在某个选中分组的包围盒内，且未命中任何组员（返回 groupId 或 null） */
  hitTestSelectedGroupBlank: (wx: number, wy: number) => { groupId: string; masterId: string } | null
  /** 🔑 commitGroupDrag 期间（含 VDR watcher nextTick bodyUp）是否在执行，是则所有 dragging/dragstop/clicked/activated 事件都应拦截 */
  isCommittingGroupDragNow: () => boolean
  canBringToFront: ReturnType<typeof computed<boolean>>
  canSendToBack: ReturnType<typeof computed<boolean>>
  canMoveUp: ReturnType<typeof computed<boolean>>
  canMoveDown: ReturnType<typeof computed<boolean>>
}

export function useComponentOperations(
  components: Ref<ComponentInstance[]>,
  selectedId: Ref<string | null>,
  pushHistory: () => void,
  /** 标记未保存改动（用于 moveComponent/resizeComponent 等不调用 pushHistory 的高频操作） */
  markDirty: () => void,
  /** 多选 ID 集合（用于 Shift+Click、框选、对齐等操作） */
  selectedIds: Ref<string[]>,
) {
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

  /**
   * 🔑 拖拽预览状态：拖拽某个组成员时，记录其 groupId + 从拖拽起点开始的累计 delta。
   *   其他组员读这个 ref，通过 CSS transform 视觉跟随；自身 x/y 不动，避免触发
   *   vue3-drag-resize 的 x/y props watcher（watcher 会调用 bodyDown→bodyMove→
   *   $nextTick(bodyUp)，emit 虚假的 dragging/dragstop 事件，dragstop 还会调
   *   pushHistory，N 个组员连锁就是 N 倍开销 + 历史栈污染）。
   *   dragstop 时由 commitGroupDrag 一次性提交 delta 到所有组员，然后清空。
   */
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
  let _isCommittingGroupDrag = false
  let _commitTimer: any = null

  function beginCommitGuard() {
    _isCommittingGroupDrag = true
    if (_commitTimer) clearTimeout(_commitTimer)
    _commitTimer = setTimeout(() => {
      nextTick(() => {
        _isCommittingGroupDrag = false
        _commitTimer = null
      })
    }, 0)
  }

  function isCommittingGroupDragNow(): boolean {
    return _isCommittingGroupDrag
  }

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

  function generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  function createComponent(type: ComponentType, x: number, y: number): ComponentInstance {
    const meta = getMeta(type)
    return {
      id: generateId(),
      type,
      name: meta?.name ?? type,
      x,
      y,
      width: meta?.defaultWidth ?? 100,
      height: meta?.defaultHeight ?? 100,
      zIndex: components.value.length + 1,
      visible: true,
      locked: false,
      props: { ...meta?.defaultProps },
      style: { ...meta?.defaultStyle },
      // 🔑 数据绑定默认值:新建组件无数据集绑定,空 dataConfig
      dataSource: { datasetId: null },
      dataConfig: {},
    }
  }

  function addComponent(type: ComponentType, x: number, y: number) {
    const instance = createComponent(type, x, y)
    components.value.push(instance)
    selectedId.value = instance.id
    // 🔑 如果新组件被放入某个已有分组（如拖入分组后立即 add），清该组冻结，强制重算新框
    if (instance.groupId) {
      for (const c of components.value) {
        if (c.groupId === instance.groupId) c.fixedGroupBox = undefined
      }
    }
    pushHistory()
    return instance
  }

  function updateComponent(id: string, updates: Partial<ComponentInstance>) {
    const index = components.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      components.value[index] = { ...components.value[index], ...updates }
      pushHistory()
    }
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

  // ========== 🔑 选中分组包围盒 & 命中测试 ==========
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

  function resizeComponent(id: string, width: number, height: number) {
    const comp = getComponent(id)
    if (comp) {
      comp.width = width
      comp.height = height
      // 🔑 resizeComponent 不调用 pushHistory（拉伸中高频调用），但仍需标记未保存改动
      markDirty()
    }
  }

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

  function removeComponent(id: string) {
    const index = components.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      const removedGid = components.value[index].groupId
      components.value.splice(index, 1)
      if (selectedId.value === id) {
        selectedId.value = null
      }
      // 🔑 删组员 → 组组成变化 → 清该组冻结，强制重算新框（反映实际成员范围）
      if (removedGid) {
        for (const c of components.value) {
          if (c.groupId === removedGid) c.fixedGroupBox = undefined
        }
      }
      pushHistory()
    }
  }

  function duplicateComponent(id: string) {
    const comp = getComponent(id)
    if (comp) {
      const copy: ComponentInstance = {
        ...comp,
        id: generateId(),
        name: `${comp.name} (副本)`,
        x: comp.x + 20,
        y: comp.y + 20,
        zIndex: comp.zIndex + 1,
        props: { ...comp.props },
        style: { ...comp.style },
      }
      components.value.push(copy)
      selectedId.value = copy.id
      pushHistory()
    }
  }

  function toggleVisibility(id: string) {
    const comp = getComponent(id)
    if (comp) {
      comp.visible = !comp.visible
      pushHistory()
    }
  }

  function toggleLock(id: string) {
    const comp = getComponent(id)
    if (comp) {
      comp.locked = !comp.locked
      pushHistory()
    }
  }

  /** 🔑 分组展开：给定组件 id → 若它有 groupId，返回同组所有未锁定、可见组件的 id 集合 */
  function expandGroup(id: string): string[] {
    const comp = getComponent(id)
    if (!comp || !comp.groupId) return [id]
    return components.value
      .filter((c) => c.groupId === comp.groupId && c.visible)
      .map((c) => c.id)
  }

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

  // ========== 🔑 对齐 / 分布 ==========
  // 这些操作只对 selectedIds（≥2）或 selectedId（单选，相对画布对齐）生效
  function getAlignTargets() {
    const ids =
      selectedIds.value.length > 0
        ? [...selectedIds.value]
        : selectedId.value
          ? [selectedId.value]
          : []
    return ids
      .map((id) => getComponent(id))
      .filter((c): c is ComponentInstance => !!c && !c.locked)
  }

  /**
   * 🔑 对齐/分布通用工具：
   *   1) 预计算新 x/y 值（newVals 数组）；2) 与原值比较，仅不同才赋值；3) 有实际变化时 pushHistory
   *   ⚠️ 为什么不「算完直接赋值 + 无条件 pushHistory」：
   *      连续点「左对齐→左对齐」或组件位置本来就等于目标位置时，
   *      若先赋值（Vue 触发响应式）再 pushHistory 走 computeSignature 比较，
   *      可能产生签名去重 + selectedIds/selectedId 纳入签名后对比边界的副作用，
   *      所以先做"纯比较"避免不必要的响应式写入。
   */
  function applyMutationsAndPush<V extends 'x' | 'y'>(
    targets: ComponentInstance[],
    axis: V,
    newVals: number[],
  ) {
    if (targets.length === 0) return
    let changed = false
    for (let i = 0; i < targets.length; i++) {
      if (targets[i][axis] !== newVals[i]) {
        ;(targets[i] as any)[axis] = newVals[i]
        changed = true
      }
    }
    if (changed) pushHistory()
  }

  /**
   * 🔑 对齐参考基准（关键：避免基准漂移）：
   *   - 选中集合**全部属于同一分组 + 该分组有冻结框** → 用冻结框作为参考
   *     （width/height 不变，对齐永远贴冻结框边缘/中心 → 连续操作不会漂移）
   *   - 跨分组 / 无分组 / 冻结值已清（add/remove 组员后） → 退回组员实际包围盒
   *
   *   ⚠️ 这就是用户反馈的根因：
   *      第一次左对齐时组员实际 minX = 冻结框 x（恰好），结果一样；
   *      但对齐后组件位置变了，第二次对齐用「新的组员实际 minX」作参考，
   *      基准漂移 → 对齐结果跳到错误位置。
   *      改为始终用冻结框作为参考，彻底消除漂移。
   */
  function getAlignReferenceBounds(targets: ComponentInstance[]): {
    minX: number
    minY: number
    maxR: number
    maxB: number
  } {
    // 默认：组员实际包围盒
    let minX = Infinity
    let minY = Infinity
    let maxR = -Infinity
    let maxB = -Infinity
    for (const c of targets) {
      minX = Math.min(minX, c.x)
      minY = Math.min(minY, c.y)
      maxR = Math.max(maxR, c.x + c.width)
      maxB = Math.max(maxB, c.y + c.height)
    }
    // 🔑 优先用冻结框：仅当所有 targets 属于同一分组且该组有 frozen 值
    const firstGid = targets[0]?.groupId
    if (firstGid) {
      const allSameGroup = targets.every((t) => t.groupId === firstGid)
      if (allSameGroup) {
        const frozenFrom = targets.find((t) => !!t.fixedGroupBox)
        const fb = frozenFrom?.fixedGroupBox
        if (fb) {
          return {
            minX: fb.x,
            minY: fb.y,
            maxR: fb.x + fb.width,
            maxB: fb.y + fb.height,
          }
        }
      }
    }
    return { minX, minY, maxR, maxB }
  }

  /** 左对齐：相对画布（单选）或选中集合左边界 */
  function alignLeft() {
    const targets = getAlignTargets()
    if (targets.length === 0) return
    const ref = getAlignReferenceBounds(targets)
    const newXs: number[] =
      targets.length < 2
        ? targets.map(() => 0)
        : targets.map(() => ref.minX)
    applyMutationsAndPush(targets, 'x', newXs)
  }
  /** 水平居中：相对画布（单选）或选中集合中心 */
  function alignHCenter() {
    const targets = getAlignTargets()
    if (targets.length === 0) return
    const ref = getAlignReferenceBounds(targets)
    const center = (ref.minX + ref.maxR) / 2
    const newXs: number[] =
      targets.length < 2
        ? (() => {
            const canvasW = 0
            // 这里不知道 canvas 尺寸；让 index.ts 覆盖此方法
            return targets.map((c) => (canvasW - c.width) / 2)
          })()
        : targets.map((c) => center - c.width / 2)
    applyMutationsAndPush(targets, 'x', newXs)
  }
  /** 右对齐：相对画布（单选）或选中集合右边界 */
  function alignRight() {
    const targets = getAlignTargets()
    if (targets.length < 2) return
    const ref = getAlignReferenceBounds(targets)
    const newXs = targets.map((c) => ref.maxR - c.width)
    applyMutationsAndPush(targets, 'x', newXs)
  }
  /** 顶部对齐：相对画布顶（=0）或选中集合顶 */
  function alignTop() {
    const targets = getAlignTargets()
    if (targets.length === 0) return
    const ref = getAlignReferenceBounds(targets)
    const newYs: number[] =
      targets.length < 2
        ? targets.map(() => 0)
        : targets.map(() => ref.minY)
    applyMutationsAndPush(targets, 'y', newYs)
  }
  /** 垂直居中：相对选中集合中心 */
  function alignVCenter() {
    const targets = getAlignTargets()
    if (targets.length < 2) return
    const ref = getAlignReferenceBounds(targets)
    const center = (ref.minY + ref.maxB) / 2
    const newYs = targets.map((c) => center - c.height / 2)
    applyMutationsAndPush(targets, 'y', newYs)
  }
  /** 底对齐：相对选中集合底 */
  function alignBottom() {
    const targets = getAlignTargets()
    if (targets.length < 2) return
    const ref = getAlignReferenceBounds(targets)
    const newYs = targets.map((c) => ref.maxB - c.height)
    applyMutationsAndPush(targets, 'y', newYs)
  }

  /** 水平等距分布：组件外框左右边界固定，组件水平间距相等 */
  function distributeHorizontal() {
    const targets = getAlignTargets()
    if (targets.length < 3) return
    const sorted = [...targets].sort((a, b) => a.x - b.x)
    // 🔑 用冻结框作为分布边界，保证连续分布不会缩框（边界漂移）
    const ref = getAlignReferenceBounds(targets)
    const minX = ref.minX
    const maxR = ref.maxR
    const totalWidth = maxR - minX
    const totalCompWidth = sorted.reduce((s, c) => s + c.width, 0)
    const gapSum = totalWidth - totalCompWidth
    const gaps = sorted.length - 1
    const gap = gapSum / gaps
    const newXs: number[] = []
    let cursor = minX
    for (const c of sorted) {
      newXs.push(cursor)
      cursor += c.width + gap
    }
    // sorted 是 targets 的子集引用，位置一一对应，直接按 sorted 顺序赋值
    applyMutationsAndPush(sorted, 'x', newXs)
  }
  /** 垂直等距分布：组件外框上下边界固定，组件垂直间距相等 */
  function distributeVertical() {
    const targets = getAlignTargets()
    if (targets.length < 3) return
    const sorted = [...targets].sort((a, b) => a.y - b.y)
    const ref = getAlignReferenceBounds(targets)
    const minY = ref.minY
    const maxB = ref.maxB
    const totalHeight = maxB - minY
    const totalCompHeight = sorted.reduce((s, c) => s + c.height, 0)
    const gapSum = totalHeight - totalCompHeight
    const gaps = sorted.length - 1
    const gap = gapSum / gaps
    const newYs: number[] = []
    let cursor = minY
    for (const c of sorted) {
      newYs.push(cursor)
      cursor += c.height + gap
    }
    applyMutationsAndPush(sorted, 'y', newYs)
  }

  // ========== 🔑 分组 / 取消分组（扁平方案） ==========
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
    selectedComponent,
    selectedComponents,
    selectedIdSet,
    componentMap,
    getComponent,
    layerList,
    // 🔑 分组包围盒 & 命中测试（统一 GroupBox 边框 + 空白区整体拖拽）
    selectedGroupBounds,
    isInSelectedGroup,
    hitTestSelectedGroupBlank,
    isCommittingGroupDragNow,
    generateId,
    createComponent,
    addComponent,
    updateComponent,
    moveComponent,
    resizeComponent,
    setComponentZIndex,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    removeComponent,
    duplicateComponent,
    toggleVisibility,
    toggleLock,
    selectComponent,
    selectComponentAccum,
    selectByRect,
    clearSelection,
    // 🔑 分组拖拽预览
    groupDragPreview,
    activeDragGroupId,
    activeDragId,
    setDragPreview,
    commitGroupDrag,
    abortGroupDrag,
    alignLeft,
    alignHCenter,
    alignRight,
    alignTop,
    alignVCenter,
    alignBottom,
    distributeHorizontal,
    distributeVertical,
    // 分组
    canGroup,
    canUngroup,
    groupSelection,
    ungroupSelection,
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
  }
}

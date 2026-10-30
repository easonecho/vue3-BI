import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { Ref } from 'vue'
import { useComponentOperations } from './use-components'
import type { ComponentInstance } from '@/views/bi-editor/types'

/**
 * 🔑 useComponentOperations 的行为护栏。
 *   这组用例先在拆分前跑通（锁定现有语义），拆分到 component-ops/* 后再次跑通，
 *   用于证明「拆分只是拆文件，没有改行为」。
 */
function setup() {
  const components: Ref<ComponentInstance[]> = ref([])
  const selectedId = ref<string | null>(null)
  const selectedIds = ref<string[]>([])
  const counters = { history: 0, dirty: 0 }
  const pushHistory = () => {
    counters.history++
  }
  const markDirty = () => {
    counters.dirty++
  }
  const ops = useComponentOperations(components, selectedId, pushHistory, markDirty, selectedIds)
  return { components, selectedId, selectedIds, counters, ops }
}

type Ctx = ReturnType<typeof setup>

/** 直接构造组件，跳过 createComponent 的默认值依赖（位置/尺寸/层级可精确控制） */
function pushComp(ctx: Ctx, id: string, x: number, y: number, extra: Partial<ComponentInstance> = {}) {
  ctx.components.value.push({
    id,
    type: 'line-chart',
    name: id,
    x,
    y,
    width: extra.width ?? 50,
    height: extra.height ?? 30,
    zIndex: extra.zIndex ?? ctx.components.value.length + 1,
    visible: extra.visible ?? true,
    locked: extra.locked ?? false,
    props: {},
    style: {},
    dataSource: { datasetId: null },
    dataConfig: {},
    ...extra,
  })
}

function byId(ctx: Ctx, id: string): ComponentInstance {
  const c = ctx.components.value.find((it) => it.id === id)
  if (!c) throw new Error(`component ${id} not found`)
  return c
}

describe('新增 / 更新 / 删除', () => {
  let ctx: Ctx
  beforeEach(() => {
    ctx = setup()
  })

  it('addComponent 使用 meta 默认尺寸、自动选中并写入历史', () => {
    const c = ctx.ops.addComponent('line-chart', 10, 20)
    expect(c.type).toBe('line-chart')
    expect(c.x).toBe(10)
    expect(c.y).toBe(20)
    expect(c.width).toBeGreaterThan(0)
    expect(c.visible).toBe(true)
    expect(c.locked).toBe(false)
    expect(c.dataSource).toEqual({ datasetId: null })
    expect(ctx.selectedId.value).toBe(c.id)
    expect(ctx.counters.history).toBe(1)
  })

  it('updateComponent 替换实例（不是原地改属性）并写入历史', () => {
    const c = ctx.ops.addComponent('line-chart', 0, 0)
    ctx.counters.history = 0
    ctx.ops.updateComponent(c.id, { name: '改名', x: 5 })
    const updated = byId(ctx, c.id)
    expect(updated.name).toBe('改名')
    expect(updated.x).toBe(5)
    expect(ctx.counters.history).toBe(1)
  })

  it('updateComponent 对不存在的 id 是 no-op', () => {
    ctx.ops.updateComponent('missing', { x: 1 })
    expect(ctx.counters.history).toBe(0)
    expect(ctx.components.value).toHaveLength(0)
  })

  it('duplicateComponent 偏移 20px、层级 +1、名称加副本后缀并选中副本', () => {
    const src = ctx.ops.addComponent('line-chart', 10, 10)
    ctx.ops.duplicateComponent(src.id)
    expect(ctx.components.value).toHaveLength(2)
    const copy = ctx.components.value[1]
    expect(copy.x).toBe(src.x + 20)
    expect(copy.y).toBe(src.y + 20)
    expect(copy.zIndex).toBe(src.zIndex + 1)
    expect(copy.name).toBe(`${src.name} (副本)`)
    expect(ctx.selectedId.value).toBe(copy.id)
  })

  it('removeComponent 清空选中，并清掉同组冻结框', () => {
    pushComp(ctx, 'a', 0, 0, { groupId: 'g1', fixedGroupBox: { x: 0, y: 0, width: 50, height: 30 } })
    pushComp(ctx, 'b', 60, 0, { groupId: 'g1', fixedGroupBox: { x: 0, y: 0, width: 50, height: 30 } })
    ctx.selectedId.value = 'a'

    ctx.ops.removeComponent('a')

    expect(ctx.selectedId.value).toBeNull()
    expect(byId(ctx, 'b').fixedGroupBox).toBeUndefined()
  })

  it('toggleVisibility / toggleLock 切换布尔值并写入历史', () => {
    const c = ctx.ops.addComponent('line-chart', 0, 0)
    ctx.counters.history = 0
    ctx.ops.toggleVisibility(c.id)
    expect(byId(ctx, c.id).visible).toBe(false)
    ctx.ops.toggleLock(c.id)
    expect(byId(ctx, c.id).locked).toBe(true)
    expect(ctx.counters.history).toBe(2)
  })
})

describe('层级操作', () => {
  let ctx: Ctx
  beforeEach(() => {
    ctx = setup()
    pushComp(ctx, 'a', 0, 0, { zIndex: 1 })
    pushComp(ctx, 'b', 0, 0, { zIndex: 2 })
    pushComp(ctx, 'c', 0, 0, { zIndex: 3 })
    ctx.selectedId.value = 'a'
  })

  it('bringToFront 保持其余组件的相对顺序', () => {
    ctx.ops.bringToFront('a')
    expect(byId(ctx, 'a').zIndex).toBe(3)
    expect(byId(ctx, 'b').zIndex).toBe(1)
    expect(byId(ctx, 'c').zIndex).toBe(2)
  })

  it('sendToBack 保持其余组件的相对顺序', () => {
    ctx.ops.sendToBack('c')
    expect(byId(ctx, 'c').zIndex).toBe(1)
    expect(byId(ctx, 'a').zIndex).toBe(2)
    expect(byId(ctx, 'b').zIndex).toBe(3)
  })

  it('moveUp / moveDown 与相邻层交换', () => {
    ctx.ops.moveUp('b')
    expect(byId(ctx, 'b').zIndex).toBe(3)
    expect(byId(ctx, 'c').zIndex).toBe(2)
    ctx.ops.moveDown('b')
    expect(byId(ctx, 'b').zIndex).toBe(2)
    expect(byId(ctx, 'c').zIndex).toBe(3)
  })

  it('canBringToFront / canSendToBack 在边界处为 false', () => {
    ctx.selectedId.value = 'c'
    expect(ctx.ops.canBringToFront.value).toBe(false)
    expect(ctx.ops.canSendToBack.value).toBe(true)
    ctx.selectedId.value = 'a'
    expect(ctx.ops.canBringToFront.value).toBe(true)
    expect(ctx.ops.canSendToBack.value).toBe(false)
  })

  it('只有一个组件时置顶/置底均禁用', () => {
    ctx.components.value = [byId(ctx, 'a')]
    ctx.selectedId.value = 'a'
    expect(ctx.ops.canBringToFront.value).toBe(false)
    expect(ctx.ops.canSendToBack.value).toBe(false)
  })
})

describe('对齐 / 分布', () => {
  let ctx: Ctx
  beforeEach(() => {
    ctx = setup()
    // a: 10..60,  b: 100..130
    pushComp(ctx, 'a', 10, 10, { width: 50, height: 30, zIndex: 1 })
    pushComp(ctx, 'b', 100, 80, { width: 30, height: 20, zIndex: 2 })
    ctx.selectedIds.value = ['a', 'b']
  })

  it('alignLeft 多选取最小 x', () => {
    ctx.ops.alignLeft()
    expect(byId(ctx, 'a').x).toBe(10)
    expect(byId(ctx, 'b').x).toBe(10)
    expect(ctx.counters.history).toBe(1)
  })

  it('alignLeft 单选贴画布左边缘', () => {
    ctx.selectedIds.value = []
    ctx.selectedId.value = 'a'
    ctx.ops.alignLeft()
    expect(byId(ctx, 'a').x).toBe(0)
  })

  it('alignRight 多选右边界对齐', () => {
    ctx.ops.alignRight()
    expect(byId(ctx, 'a').x).toBe(80) // 130 - 50
    expect(byId(ctx, 'b').x).toBe(100) // 130 - 30
  })

  it('alignHCenter 多选按集合中心居中', () => {
    ctx.ops.alignHCenter()
    // 集合 10..130，中心 70：a -> 70-25=45，b -> 70-15=55
    expect(byId(ctx, 'a').x).toBe(45)
    expect(byId(ctx, 'b').x).toBe(55)
  })

  it('alignTop / alignBottom / alignVCenter 按 y 轴计算', () => {
    ctx.ops.alignTop()
    expect(byId(ctx, 'a').y).toBe(10)
    expect(byId(ctx, 'b').y).toBe(10)
    // 对齐后集合 10..40，中心 25：a -> 25-15=10，b -> 25-10=15
    ctx.ops.alignVCenter()
    expect(byId(ctx, 'a').y).toBe(10)
    expect(byId(ctx, 'b').y).toBe(15)
    // 底边界 40：a -> 40-30=10，b -> 40-20=20
    ctx.ops.alignBottom()
    expect(byId(ctx, 'a').y).toBe(10)
    expect(byId(ctx, 'b').y).toBe(20)
  })

  it('位置未变化时不写历史', () => {
    ctx.components.value.forEach((c) => (c.x = 10))
    ctx.counters.history = 0
    ctx.ops.alignLeft()
    expect(ctx.counters.history).toBe(0)
  })

  it('distributeHorizontal 保持左右边界、间距相等', () => {
    ctx.components.value = []
    pushComp(ctx, 'a', 0, 0, { width: 20 })
    pushComp(ctx, 'b', 50, 0, { width: 20 })
    pushComp(ctx, 'c', 130, 0, { width: 20 })
    ctx.selectedIds.value = ['a', 'b', 'c']
    ctx.ops.distributeHorizontal()
    // 边界 0..150，总宽 60，间距 (150-60)/2 = 45 → 0, 65, 130
    expect(byId(ctx, 'a').x).toBe(0)
    expect(byId(ctx, 'b').x).toBe(65)
    expect(byId(ctx, 'c').x).toBe(130)
  })

  it('distributeVertical 少于 3 个组件时不做任何事', () => {
    ctx.ops.distributeVertical()
    expect(byId(ctx, 'a').y).toBe(10)
    expect(byId(ctx, 'b').y).toBe(80)
    expect(ctx.counters.history).toBe(0)
  })

  it('锁定的组件不参与对齐', () => {
    byId(ctx, 'a').locked = true
    ctx.ops.alignLeft()
    expect(byId(ctx, 'a').x).toBe(10)
    // targets 只剩 b，单目标 → 贴画布左边缘 0
    expect(byId(ctx, 'b').x).toBe(0)
    expect(ctx.counters.history).toBe(1)
  })
})

describe('分组', () => {
  let ctx: Ctx
  beforeEach(() => {
    ctx = setup()
    pushComp(ctx, 'a', 10, 10, { width: 50, height: 30, zIndex: 1 })
    pushComp(ctx, 'b', 100, 60, { width: 30, height: 20, zIndex: 2 })
    ctx.selectedIds.value = ['a', 'b']
  })

  it('groupSelection 生成 groupId 与统一的冻结框', () => {
    ctx.ops.groupSelection()
    const gid = byId(ctx, 'a').groupId
    expect(gid).toBeTruthy()
    expect(byId(ctx, 'b').groupId).toBe(gid)
    // 包围盒：10..130 × 10..80
    expect(byId(ctx, 'a').fixedGroupBox).toEqual({ x: 10, y: 10, width: 120, height: 70 })
    expect(ctx.counters.history).toBe(1)
  })

  it('canGroup / canUngroup 随分组状态变化', () => {
    expect(ctx.ops.canGroup.value).toBe(true)
    expect(ctx.ops.canUngroup.value).toBe(false)
    ctx.ops.groupSelection()
    expect(ctx.ops.canGroup.value).toBe(false)
    expect(ctx.ops.canUngroup.value).toBe(true)
    ctx.ops.ungroupSelection()
    expect(byId(ctx, 'a').groupId).toBeUndefined()
    expect(byId(ctx, 'a').fixedGroupBox).toBeUndefined()
    expect(ctx.ops.canUngroup.value).toBe(false)
  })

  it('selectedGroupBounds 优先使用冻结框，缺失时回退实时包围盒', () => {
    ctx.ops.groupSelection()
    ctx.selectedIds.value = []
    ctx.selectedId.value = 'a'
    expect(ctx.ops.selectedGroupBounds.value).toHaveLength(1)
    expect(ctx.ops.selectedGroupBounds.value[0]).toMatchObject({ x: 10, y: 10, width: 120, height: 70 })

    byId(ctx, 'a').fixedGroupBox = undefined
    byId(ctx, 'b').fixedGroupBox = undefined
    expect(ctx.ops.selectedGroupBounds.value[0]).toMatchObject({ x: 10, y: 10, width: 120, height: 70 })
  })

  it('isInSelectedGroup 判断组员归属', () => {
    ctx.ops.groupSelection()
    ctx.selectedIds.value = []
    ctx.selectedId.value = 'a'
    expect(ctx.ops.isInSelectedGroup('b')).toBe(true)
    expect(ctx.ops.isInSelectedGroup('a')).toBe(true)
    ctx.ops.clearSelection()
    expect(ctx.ops.isInSelectedGroup('a')).toBe(false)
  })

  it('hitTestSelectedGroupBlank 命中空白区返回主体，命中组员返回 null', () => {
    ctx.ops.groupSelection()
    ctx.selectedIds.value = []
    ctx.selectedId.value = 'a'
    // (115, 75) 在 b 矩形（100..130 × 60..80）内 → 命中组员
    expect(ctx.ops.hitTestSelectedGroupBlank(115, 75)).toBeNull()
    // (20, 75) 在组框内、但不在 a（10..60 × 10..40）/ b 矩形内 → 空白区
    expect(ctx.ops.hitTestSelectedGroupBlank(20, 75)).toEqual({ groupId: byId(ctx, 'a').groupId, masterId: 'b' })
    // 组框外
    expect(ctx.ops.hitTestSelectedGroupBlank(0, 0)).toBeNull()
  })
})

describe('选中', () => {
  let ctx: Ctx
  beforeEach(() => {
    ctx = setup()
  })

  it('selectComponent 选中分组内一个成员时整组选中', () => {
    pushComp(ctx, 'a', 0, 0, { groupId: 'g1' })
    pushComp(ctx, 'b', 50, 0, { groupId: 'g1' })
    pushComp(ctx, 'c', 200, 0, {})
    ctx.ops.selectComponent('a')
    expect(ctx.selectedId.value).toBe('a')
    expect(ctx.selectedIds.value).toEqual(['a', 'b'])
  })

  it('selectComponent 忽略锁定组件', () => {
    pushComp(ctx, 'a', 0, 0, { locked: true })
    ctx.ops.selectComponent('a')
    expect(ctx.selectedId.value).toBeNull()
  })

  it('selectComponentAccum toggle=true 再次点击同组成员会整组移除', () => {
    pushComp(ctx, 'a', 0, 0, { groupId: 'g1' })
    pushComp(ctx, 'b', 50, 0, { groupId: 'g1' })
    pushComp(ctx, 'c', 200, 0, {})
    ctx.ops.selectComponent('c')
    ctx.ops.selectComponentAccum('a', true)
    expect(new Set(ctx.selectedIds.value)).toEqual(new Set(['c', 'a', 'b']))
    ctx.ops.selectComponentAccum('a', true)
    expect(ctx.selectedIds.value).toEqual(['c'])
    expect(ctx.selectedId.value).toBe('a')
  })

  it('selectByRect 选中相交组件，主选取最高 zIndex，additive 累加', () => {
    pushComp(ctx, 'a', 0, 0, { width: 40, height: 40, zIndex: 1 })
    pushComp(ctx, 'b', 10, 10, { width: 40, height: 40, zIndex: 3 })
    pushComp(ctx, 'c', 300, 300, { width: 40, height: 40, zIndex: 5 })

    ctx.ops.selectByRect({ x: -5, y: -5, width: 100, height: 100 })
    expect(ctx.selectedIds.value).toEqual(['a', 'b'])
    expect(ctx.selectedId.value).toBe('b')

    ctx.ops.selectByRect({ x: 295, y: 295, width: 50, height: 50 }, true)
    expect(new Set(ctx.selectedIds.value)).toEqual(new Set(['a', 'b', 'c']))
    expect(ctx.selectedId.value).toBe('c')
  })

  it('selectByRect 跳过隐藏与锁定组件', () => {
    pushComp(ctx, 'a', 0, 0, { width: 40, height: 40, visible: false })
    pushComp(ctx, 'b', 10, 10, { width: 40, height: 40, locked: true })
    ctx.ops.selectByRect({ x: -5, y: -5, width: 100, height: 100 })
    expect(ctx.selectedIds.value).toEqual([])
    expect(ctx.selectedId.value).toBeNull()
  })

  it('clearSelection 清空单选与多选', () => {
    pushComp(ctx, 'a', 0, 0)
    ctx.ops.selectComponent('a')
    ctx.ops.clearSelection()
    expect(ctx.selectedId.value).toBeNull()
    expect(ctx.selectedIds.value).toEqual([])
  })
})

describe('移动 / 拖拽预览', () => {
  let ctx: Ctx
  beforeEach(() => {
    ctx = setup()
    pushComp(ctx, 'a', 0, 0, { groupId: 'g1', fixedGroupBox: { x: 0, y: 0, width: 100, height: 50 } })
    pushComp(ctx, 'b', 50, 0, { groupId: 'g1', fixedGroupBox: { x: 0, y: 0, width: 100, height: 50 } })
  })

  it('dragPreview 模式累计 delta，不改动组员 x/y', () => {
    ctx.ops.moveComponent('a', 10, 5, { dragPreview: true })
    expect(ctx.ops.groupDragPreview.value).toMatchObject({ draggedId: 'a', dx: 10, dy: 5 })
    ctx.ops.moveComponent('a', 15, 8, { dragPreview: true })
    expect(ctx.ops.groupDragPreview.value).toMatchObject({ dx: 15, dy: 8 })
    expect(byId(ctx, 'b').x).toBe(50)
    expect(ctx.counters.dirty).toBe(2)
    expect(ctx.counters.history).toBe(0)
  })

  it('commitGroupDrag 一次性把 delta 提交给组员与冻结框，并清空预览', () => {
    ctx.ops.setDragPreview('a', 'g1', 15, 8)
    ctx.ops.commitGroupDrag('a')
    expect(byId(ctx, 'b').x).toBe(65)
    expect(byId(ctx, 'b').y).toBe(8)
    expect(byId(ctx, 'b').fixedGroupBox).toEqual({ x: 15, y: 8, width: 100, height: 50 })
    expect(ctx.ops.groupDragPreview.value).toBeNull()
    expect(ctx.ops.activeDragId.value).toBeNull()
    expect(ctx.ops.activeDragGroupId.value).toBeNull()
    // 提交期间有守卫窗口
    expect(ctx.ops.isCommittingGroupDragNow()).toBe(true)
  })

  it('commitGroupDrag 无预览时只清空状态', () => {
    ctx.ops.commitGroupDrag('a')
    expect(byId(ctx, 'b').x).toBe(50)
    expect(ctx.ops.groupDragPreview.value).toBeNull()
    expect(ctx.ops.isCommittingGroupDragNow()).toBe(false)
  })

  it('abortGroupDrag 清空预览但不移动组员', () => {
    ctx.ops.setDragPreview('a', 'g1', 30, 20)
    ctx.ops.abortGroupDrag()
    expect(ctx.ops.groupDragPreview.value).toBeNull()
    expect(byId(ctx, 'b').x).toBe(50)
    expect(byId(ctx, 'b').y).toBe(0)
  })

  it('linkGroup 模式立即同步组员与冻结框', () => {
    ctx.ops.moveComponent('a', 10, 5, { linkGroup: true })
    expect(byId(ctx, 'b').x).toBe(60)
    expect(byId(ctx, 'b').y).toBe(5)
    expect(byId(ctx, 'b').fixedGroupBox).toMatchObject({ x: 10, y: 5 })
  })

  it('lock 的组员不跟随移动', () => {
    byId(ctx, 'b').locked = true
    ctx.ops.moveComponent('a', 10, 0, { linkGroup: true })
    expect(byId(ctx, 'b').x).toBe(50)
  })

  it('无 groupId 时 dragPreview 只移动自身', () => {
    ctx.components.value = []
    pushComp(ctx, 'x', 0, 0)
    pushComp(ctx, 'y', 0, 0)
    ctx.ops.moveComponent('x', 12, 3, { dragPreview: true })
    expect(byId(ctx, 'x').x).toBe(12)
    expect(byId(ctx, 'y').x).toBe(0)
    expect(ctx.ops.groupDragPreview.value).toBeNull()
  })

  it('resizeComponent 只标记 dirty，不写历史', () => {
    ctx.ops.resizeComponent('a', 200, 100)
    expect(byId(ctx, 'a').width).toBe(200)
    expect(ctx.counters.dirty).toBe(1)
    expect(ctx.counters.history).toBe(0)
  })
})

describe('索引与派生列表', () => {
  it('getComponent O(1) 命中，layerList 按 zIndex 倒序', () => {
    const ctx = setup()
    pushComp(ctx, 'a', 0, 0, { zIndex: 2 })
    pushComp(ctx, 'b', 0, 0, { zIndex: 5 })
    expect(ctx.ops.getComponent('b')?.zIndex).toBe(5)
    expect(ctx.ops.getComponent('missing')).toBeUndefined()
    expect(ctx.ops.layerList.value.map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('selectedComponents 在多选为空时回退到单选，按 zIndex 排序', () => {
    const ctx = setup()
    pushComp(ctx, 'a', 0, 0, { zIndex: 1 })
    pushComp(ctx, 'b', 0, 0, { zIndex: 3 })
    pushComp(ctx, 'c', 0, 0, { zIndex: 2 })
    ctx.selectedId.value = 'b'
    expect(ctx.ops.selectedComponents.value.map((c) => c.id)).toEqual(['b'])
    ctx.selectedIds.value = ['a', 'c']
    expect(ctx.ops.selectedComponents.value.map((c) => c.id)).toEqual(['c', 'a'])
  })
})

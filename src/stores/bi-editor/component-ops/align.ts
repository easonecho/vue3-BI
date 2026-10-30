import type { ComponentInstance } from '@/views/bi-editor/types'
import type { ComponentIndexApi, OpsDeps } from './types'

/**
 * 🔑 对齐 / 分布。
 *   这些操作只对 selectedIds（≥2）或 selectedId（单选，相对画布对齐）生效。
 *   ⚠️ 单选的水平/垂直居中与右/底对齐需要画布尺寸，由 stores/bi-editor/index.ts 包装覆盖。
 */
export function createAlign(deps: OpsDeps, index: ComponentIndexApi) {
  const { selectedId, selectedIds, pushHistory } = deps
  const { getComponent } = index

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
        targets[i][axis] = newVals[i]
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

  return {
    getAlignTargets,
    applyMutationsAndPush,
    getAlignReferenceBounds,
    alignLeft,
    alignHCenter,
    alignRight,
    alignTop,
    alignVCenter,
    alignBottom,
    distributeHorizontal,
    distributeVertical,
  }
}

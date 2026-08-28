import { ref, type Ref } from 'vue'
import type {
  ComponentInstance,
  CanvasState,
  HistorySnapshot,
  GuideLine,
} from '@/views/bi-editor/types'

/**
 * 🔑 撤销/重做恢复期间的「写保护」标志。
 *
 * 为什么需要这个标志：
 *   restoreSnapshot 会更新 components/canvas/guides/selectedId，
 *   这些响应式变更会触发 vue3-drag-resize 的 x/y/w/h watcher（内部用 this.$nextTick
 *   调用 bodyUp，emit 'dragstop'）以及 useRulerGuides 的 guides watcher，
 *   它们最终都会回调 pushHistory。如果不拦截，撤销刚把 historyIndex 减 1，
 *   紧接着的虚假 pushHistory 又把它加回去 → 撤销被立即抵消，表现为反复打印
 *   [pushHistory] COMMITTED 且撤销无效。
 *
 * 为什么用 setTimeout(0) 重置而不是 nextTick：
 *   vue3-drag-resize 的 watcher 里是 this.$nextTick(() => bodyUp())，bodyUp 才
 *   emit dragstop → handleVdrDragstop → pushHistory。这是一条「nextTick 链」：
 *     微任务1: Vue scheduler flush watchers → x/y watcher 调度 bodyUp 到 nextTick
 *     微任务2: bodyUp emit dragstop → pushHistory
 *   nextTick 是微任务，单层 nextTick 重置会在微任务1末尾就跑，早于微任务2的 pushHistory，
 *   导致 isRestoring 已被重置为 false，拦截失效。
 *   setTimeout(0) 是宏任务，会在所有微任务（整条 nextTick 链）跑完后才执行，
 *   确保 isRestoring 在 pushHistory 被调用时仍为 true，可靠拦截。
 */
let isRestoring = false

/** 🔑 历史栈容量上限：超过后从栈底（最旧）丢弃，防止长时间编辑造成内存无限增长。
 *   - 每个 HistoryEntry 约 = canvas + N components + K guides 的 JSON 字符串，百量级才会显著占用内存
 *   - 设定 200 步上限：既有足够可撤销空间，也不会拖慢整体内存与 GC
 */
const MAX_HISTORY = 200

/** 简易深比较：两个可序列化对象是否语义相等（JSON.stringify 对称，保证快速） */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (Array.isArray(a) !== Array.isArray(b)) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

/**
 * 🔑 增量恢复 components：只有 id 相同但内容真的变了的组件才替换对象引用。
 *   这样做的好处：
 *     - v-for key=comp.id 的 CanvasComponentItem 不会被 Vue 整体重建
 *     - 每个 CanvasComponentItem 里的 watch(comp) 只在 comp 引用变化时触发
 *       → 真正被改动的组件才重建 VueDragResize，其他全部跳过
 *     - 组件内部的 ECharts / Widget 实例也保持不变，无需重新初始化 ECharts
 */
function mergeComponents(
  current: Ref<ComponentInstance[]>,
  snapshotArr: ComponentInstance[],
): { updated: boolean } {
  // const snapshotMap = new Map(snapshotArr.map((c) => [c.id, c]))
  const curMap = new Map(current.value.map((c) => [c.id, c]))

  // 先构建新数组，严格按 snapshot 的顺序
  const result: ComponentInstance[] = []
  let mutated = false
  for (const snapComp of snapshotArr) {
    const cur = curMap.get(snapComp.id)
    if (cur && deepEqual(cur, snapComp)) {
      // 未变化 → 复用原引用，跳过 Vue re-render / VDR 重建
      result.push(cur)
    } else {
      // 新增或内容变更 → 替换成全新的快照对象（触发 watch comp → VDR 重建）
      result.push(snapComp)
      mutated = true
    }
  }
  // 如果存在被删除的组件（cur 里有 snapshot 没有），也是 mutation
  if (current.value.length !== result.length) mutated = true

  // 深度比较数组元素顺序/引用完全一致时避免替换整个数组，减少 v-for 的 diff
  if (!mutated) return { updated: false }
  let sameOrder = true
  if (current.value.length === result.length) {
    for (let i = 0; i < result.length; i++) {
      if (current.value[i] !== result[i]) {
        sameOrder = false
        break
      }
    }
  } else {
    sameOrder = false
  }
  if (sameOrder) return { updated: false }

  current.value = result
  return { updated: true }
}

/** canvas/guides 单对象增量恢复：相等就保留原引用，避免不必要的 watcher */
function mergeCanvas(
  current: Ref<CanvasState>,
  snapCanvas: CanvasState,
  keepViewport: { zoom: number; scrollX: number; scrollY: number },
): boolean {
  const merged: CanvasState = { ...snapCanvas, ...keepViewport }
  if (deepEqual(current.value, merged)) return false
  current.value = merged
  return true
}

function mergeGuides(current: Ref<GuideLine[]>, snapGuides: GuideLine[]): boolean {
  if (deepEqual(current.value, snapGuides)) return false
  current.value = JSON.parse(JSON.stringify(snapGuides))
  return true
}

interface HistoryEntry {
  /** 完整序列化字符串（含视口状态），用于 undo/redo 恢复 */
  serialized: string
  /** 去重签名（排除视口状态 + selectedId），用于 pushHistory 去重比较 */
  signature: string
}

export interface HistoryApi {
  /** 历史栈：存储 { serialized, signature } 对象，避免每次 push 重复计算签名 */
  history: Ref<HistoryEntry[]>
  historyIndex: Ref<number>
  createSnapshot: () => HistorySnapshot
  restoreSnapshot: (snapshot: HistorySnapshot) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  /** 是否正在恢复快照（undo/redo 期间）—— 供交互层拦截虚假事件用 */
  isRestoringNow: () => boolean
}

export function useHistory(
  components: Ref<ComponentInstance[]>,
  canvas: Ref<CanvasState>,
  guides: Ref<GuideLine[]>,
  selectedId: Ref<string | null>,
  selectedIds: Ref<string[]>,
): HistoryApi {
  // 🔑 历史栈存储 { serialized, signature } 对象：
  //   - serialized: 完整状态 JSON 字符串（含视口），用于 undo/redo 恢复
  //   - signature: 去重签名（排除视口 + selectedId），缓存后避免 pushHistory 时重复计算
  //   这样彻底切断与 Vue 响应式系统的引用关系，避免 Proxy 对象被存入历史。
  const history = ref<HistoryEntry[]>([])
  const historyIndex = ref(-1)

  /** 把当前状态序列化为 JSON 字符串（剥离所有 Proxy） */
  function serializeState(): string {
    return JSON.stringify({
      components: components.value,
      canvas: canvas.value,
      guides: guides.value,
      selectedId: selectedId.value,
      // 🔑 必须序列化多选集合：undo/redo 后要恢复之前的多选态，
      //   否则框选 3 个 → 对齐 → undo，多选数组丢失，canDistribute 变 false 按钮失效。
      selectedIds: selectedIds.value,
    })
  }

  /** 把 JSON 字符串反序列化为快照对象（全新普通对象，无 Proxy） */
  function deserializeState(json: string): HistorySnapshot {
    return JSON.parse(json) as HistorySnapshot
  }

  function createSnapshot(): HistorySnapshot {
    return deserializeState(serializeState())
  }

  function restoreSnapshot(snapshot: HistorySnapshot) {
    // 🔑 进入恢复期：阻止 restore 期间触发的 watcher（vue3-drag-resize 的 x/y watcher
    //   emit dragstop → handleVdrDragstop → pushHistory；guides watcher → setGuides → pushHistory）
    //   把 historyIndex 又加回去，抵消撤销/重做。
    isRestoring = true
    try {
      const { zoom, scrollX, scrollY } = canvas.value
      // 🔑 增量恢复：只有真实变化的对象才替换引用，未变化的组件/画布/参考线
      //   保持原引用不变，避免触发全量 re-render / VDR 重建 / ECharts 重初始化。
      mergeComponents(components, snapshot.components as ComponentInstance[])
      mergeCanvas(canvas, snapshot.canvas as CanvasState, { zoom, scrollX, scrollY })
      mergeGuides(guides, snapshot.guides as GuideLine[])
      if (selectedId.value !== snapshot.selectedId) {
        selectedId.value = snapshot.selectedId
      }
      // 🔑 恢复多选集合：保证 undo/redo 后 RightPanel 分布/对齐按钮的 disabled 状态一致
      const snapIds = snapshot.selectedIds ?? []
      const cur = selectedIds.value
      const same =
        cur.length === snapIds.length && cur.every((id, i) => id === snapIds[i])
      if (!same) selectedIds.value = [...snapIds]
    } finally {
      // 🔑 用 setTimeout(0)（宏任务）重置：必须晚于 vue3-drag-resize 的 nextTick 链
      //   (watcher → this.$nextTick → bodyUp → dragstop → pushHistory)，
      //   单层 nextTick（微任务）会在 bodyUp 之前就重置，拦截失效。
      setTimeout(() => {
        isRestoring = false
      }, 0)
    }
  }

  /**
   * 🔑 性能优化：直接从响应式状态计算签名，省掉 pushHistory/clearHistory 中的
   *   JSON.parse 往返（原 serializeState→deserializeState→snapshotSignature 三趟 → 两趟）。
   *   排除视口状态（zoom / scrollX / scrollY）和 selectedId，只比较「操作类」状态。
   */
  function computeSignature(): string {
    const { zoom, scrollX, scrollY, ...canvasRest } = canvas.value
    void zoom
    void scrollX
    void scrollY
    return JSON.stringify({
      components: components.value,
      canvas: canvasRest,
      guides: guides.value,
      // 🔑 selectedIds/selectedId 纳入签名：
      //   纯选中集合变更（如框选后不操作就取消、再重新框选）不算改动、不进栈；
      //   但组件位置 + 选中集合同时变化（对齐/分布场景）算新状态，入栈。
      selectedId: selectedId.value,
      selectedIds: selectedIds.value,
    })
  }

  function pushHistory() {
    // 🔑 恢复期间拦截：restoreSnapshot 触发的 watcher（vue3-drag-resize x/y watcher
    //   → dragstop → handleVdrDragstop → pushHistory；guides watcher → setGuides → pushHistory）
    //   都是恢复的副作用，不是用户操作，必须丢弃，否则会立即抵消 undo/redo。
    if (isRestoring) {
      return
    }

    // 🔑 序列化当前状态为字符串，彻底剥离 Proxy
    const serialized = serializeState()
    // 🔑 性能优化：直接从响应式状态计算签名，省掉 JSON.parse 往返
    const newSig = computeSignature()

    // 🔑 直接与上一条历史项的缓存签名比较，无需再次反序列化 + 计算签名
    const currentEntry = history.value[historyIndex.value]
    if (currentEntry && newSig === currentEntry.signature) {
      return
    }

    // 裁剪 redo 分支
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    // 🔑 存储 { serialized, signature } 对象，signature 供后续 pushHistory 去重比较
    history.value.push({ serialized, signature: newSig })
    // 🔑 栈容量上限：超过 MAX_HISTORY 后从栈底裁剪，同时同步调整 historyIndex 保持当前游标相对位置不变，
    //   否则裁掉 0 后 historyIndex 会等于新数组长度，越界导致 canUndo/canRedo 逻辑错乱
    if (history.value.length > MAX_HISTORY) {
      const dropped = history.value.length - MAX_HISTORY
      history.value.splice(0, dropped)
      historyIndex.value = Math.max(0, historyIndex.value - dropped)
    }
    historyIndex.value = history.value.length - 1
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      // 🔑 从缓存的 serialized 字符串反序列化得到全新普通对象，再恢复状态
      const snapshot = deserializeState(history.value[historyIndex.value].serialized)
      restoreSnapshot(snapshot)
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const snapshot = deserializeState(history.value[historyIndex.value].serialized)
      restoreSnapshot(snapshot)
    }
  }

  function clearHistory() {
    const serialized = serializeState()
    const signature = computeSignature()
    history.value = [{ serialized, signature }]
    historyIndex.value = 0
  }

  function canUndo(): boolean {
    return historyIndex.value > 0
  }

  function canRedo(): boolean {
    return historyIndex.value < history.value.length - 1
  }

  return {
    history,
    historyIndex,
    createSnapshot,
    restoreSnapshot,
    pushHistory,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    isRestoringNow: () => isRestoring,
  }
}

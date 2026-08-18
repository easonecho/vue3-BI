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

const MAX_HISTORY = 100

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

export interface HistoryApi {
  /** 历史栈：仅存储 JSON 字符串，彻底避免 Proxy/响应式对象污染 */
  history: Ref<string[]>
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
): HistoryApi {
  // 🔑 历史栈只存 JSON 字符串：
  //   - 写入：JSON.stringify 快照对象 → 字符串
  //   - 读取：JSON.parse 字符串 → 全新普通对象（无 Proxy/响应式引用）
  //   这样彻底切断与 Vue 响应式系统的引用关系，避免 Proxy 对象被存入历史。
  const history = ref<string[]>([])
  const historyIndex = ref(-1)

  /** 把当前状态序列化为 JSON 字符串（剥离所有 Proxy） */
  function serializeState(): string {
    return JSON.stringify({
      components: components.value,
      canvas: canvas.value,
      guides: guides.value,
      selectedId: selectedId.value,
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
   * 生成快照签名（用于去重）：
   *   只比较「操作类」状态（components / canvas 配置 / guides），
   *   排除视口状态（zoom / scrollX / scrollY）和 selectedId。
   */
  function snapshotSignature(snapshot: HistorySnapshot): string {
    const { zoom, scrollX, scrollY, ...canvasRest } = snapshot.canvas
    void zoom
    void scrollX
    void scrollY
    return JSON.stringify({
      components: snapshot.components,
      canvas: canvasRest,
      guides: snapshot.guides,
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
    const snapshot = deserializeState(serialized)

    // 与当前历史项比较（反序列化后再生成签名）
    const currentSerialized = history.value[historyIndex.value]
    const currentSnapshot = currentSerialized ? deserializeState(currentSerialized) : null
    const newSig = snapshotSignature(snapshot)
    const curSig = currentSnapshot ? snapshotSignature(currentSnapshot) : null

    if (currentSnapshot && newSig === curSig) {
      return
    }

    // 裁剪 redo 分支
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    // 🔑 只存字符串，不存对象
    history.value.push(serialized)
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
    // debug log removed
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      // 🔑 从字符串反序列化得到全新普通对象，再恢复状态
      const snapshot = deserializeState(history.value[historyIndex.value])
      restoreSnapshot(snapshot)
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const snapshot = deserializeState(history.value[historyIndex.value])
      restoreSnapshot(snapshot)
    }
  }

  function clearHistory() {
    const serialized = serializeState()
    history.value = [serialized]
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

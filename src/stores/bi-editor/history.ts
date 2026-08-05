import { ref, type Ref } from 'vue'
import type {
  ComponentInstance,
  CanvasState,
  HistorySnapshot,
  GuideLine,
} from '@/views/bi-editor/types'

const MAX_HISTORY = 100

export interface HistoryApi {
  history: Ref<HistorySnapshot[]>
  historyIndex: Ref<number>
  createSnapshot: () => HistorySnapshot
  restoreSnapshot: (snapshot: HistorySnapshot) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export function useHistory(
  components: Ref<ComponentInstance[]>,
  canvas: Ref<CanvasState>,
  guides: Ref<GuideLine[]>,
  selectedId: Ref<string | null>,
): HistoryApi {
  const history = ref<HistorySnapshot[]>([])
  const historyIndex = ref(-1)

  function createSnapshot(): HistorySnapshot {
    return {
      components: JSON.parse(JSON.stringify(components.value)),
      canvas: JSON.parse(JSON.stringify(canvas.value)),
      guides: JSON.parse(JSON.stringify(guides.value)),
      selectedId: selectedId.value,
    }
  }

  function restoreSnapshot(snapshot: HistorySnapshot) {
    const { zoom, scrollX, scrollY } = canvas.value
    components.value = JSON.parse(JSON.stringify(snapshot.components))
    canvas.value = JSON.parse(JSON.stringify(snapshot.canvas))
    canvas.value.zoom = zoom
    canvas.value.scrollX = scrollX
    canvas.value.scrollY = scrollY
    guides.value = JSON.parse(JSON.stringify(snapshot.guides))
    selectedId.value = snapshot.selectedId
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
    const snapshot = createSnapshot()
    const currentSnapshot = history.value[historyIndex.value]
    const newSig = snapshotSignature(snapshot)
    const curSig = currentSnapshot ? snapshotSignature(currentSnapshot) : null

    if (currentSnapshot && newSig === curSig) {
      console.log('[pushHistory] DEDUP HIT — skipped (no actual change)')
      return
    }

    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(snapshot)
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
    console.log('[pushHistory] COMMITTED', {
      index: historyIndex.value,
      historyLen: history.value.length,
      componentsCount: snapshot.components.length,
      selectedId: snapshot.selectedId,
      history: history.value,
    })
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      restoreSnapshot(history.value[historyIndex.value])
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      restoreSnapshot(history.value[historyIndex.value])
    }
  }

  function clearHistory() {
    const snap = createSnapshot()
    history.value = [snap]
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
  }
}

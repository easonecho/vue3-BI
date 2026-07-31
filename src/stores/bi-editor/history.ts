import { ref, type Ref } from 'vue'
import type {
  ComponentInstance,
  CanvasState,
  HistorySnapshot,
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
  selectedId: Ref<string | null>,
): HistoryApi {
  const history = ref<HistorySnapshot[]>([])
  const historyIndex = ref(-1)

  function createSnapshot(): HistorySnapshot {
    return {
      components: JSON.parse(JSON.stringify(components.value)),
      canvas: JSON.parse(JSON.stringify(canvas.value)),
      selectedId: selectedId.value,
    }
  }

  function restoreSnapshot(snapshot: HistorySnapshot) {
    components.value = JSON.parse(JSON.stringify(snapshot.components))
    canvas.value = JSON.parse(JSON.stringify(snapshot.canvas))
    selectedId.value = snapshot.selectedId
  }

  function pushHistory() {
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(createSnapshot())
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
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
    history.value = [createSnapshot()]
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

import type { Ref } from 'vue'
import type { CanvasState, ComponentInstance } from '@/views/bi-editor/types'

/** 对齐操作中「单选时需要画布尺寸」的四个方向（由 use-components 提供默认实现） */
export interface CanvasAlignOps {
  alignHCenter: () => void
  alignRight: () => void
  alignVCenter: () => void
  alignBottom: () => void
}

export interface CanvasAlignDeps {
  canvas: Ref<CanvasState>
  components: Ref<ComponentInstance[]>
  selectedId: Ref<string | null>
  selectedIds: Ref<string[]>
  pushHistory: () => void
  ops: CanvasAlignOps
}

export interface CanvasAlignApi {
  alignHCenter: () => void
  alignRight: () => void
  alignVCenter: () => void
  alignBottom: () => void
}

/**
 * 🔑 画布感知的对齐包装。
 *
 *   use-component-operations 无法访问 canvas，因此：
 *   - 多选：沿用组件集合包围盒对齐（ops 的默认实现）
 *   - 单选：按画布尺寸对齐（本模块覆盖）
 */
export function createCanvasAlign(deps: CanvasAlignDeps): CanvasAlignApi {
  const { canvas, components, selectedId, selectedIds, pushHistory, ops } = deps

  function alignHCenter() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.x = (canvas.value.width - comp.width) / 2
        pushHistory()
        return
      }
    }
    ops.alignHCenter()
  }

  function alignRight() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.x = canvas.value.width - comp.width
        pushHistory()
        return
      }
    }
    ops.alignRight()
  }

  function alignVCenter() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.y = (canvas.value.height - comp.height) / 2
        pushHistory()
        return
      }
    }
    ops.alignVCenter()
  }

  function alignBottom() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.y = canvas.value.height - comp.height
        pushHistory()
        return
      }
    }
    ops.alignBottom()
  }

  return {
    alignHCenter,
    alignRight,
    alignVCenter,
    alignBottom,
  }
}

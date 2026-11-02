import { nextTick, type Ref } from 'vue'
import type { ComponentInstance, CanvasState, DashboardLayout, GuideLine } from '@/views/bi-editor/types'
import { DEFAULT_ZOOM, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'

export interface ApplyEditorLayoutDeps {
  canvas: Ref<CanvasState>
  components: Ref<ComponentInstance[]>
  guides: Ref<GuideLine[]>
  selectedId: Ref<string | null>
  isLoading: Ref<boolean>
  isDirty: Ref<boolean>
  clearHistory: () => void
  resetViewport: () => void
}

/**
 * 序列化当前编辑器状态为可持久化的 DashboardLayout。
 * 视口状态(zoom/scrollX/scrollY)不持久化, 加载时由 resetViewport 还原。
 * 使用 JSON.parse(JSON.stringify(...)) 剥离 Vue 响应式 Proxy(与 history.ts 思路一致)。
 */
export function serializeEditorLayout(
  canvas: CanvasState,
  components: ComponentInstance[],
  guides: GuideLine[],
): DashboardLayout {
  return {
    version: '1.0',
    canvas: {
      ...canvas,
      // 视口状态不持久化, 用默认值占位, 加载时 resetViewport 会覆盖
      zoom: DEFAULT_ZOOM,
      scrollX: DEFAULT_VIEWPORT_OFFSET.x,
      scrollY: DEFAULT_VIEWPORT_OFFSET.y,
    },
    components: JSON.parse(JSON.stringify(components)),
    guides: JSON.parse(JSON.stringify(guides)),
  }
}

/**
 * 将 DashboardLayout 应用到当前编辑器状态。
 * 通过 isLoading 标志拦截脏状态检测 watch, 避免恢复过程被误判为用户改动。
 * 🔑 迁移逻辑: 老看板的 ComponentInstance 没有 dataSource/dataConfig 字段, 统一补默认值。
 */
export function applyEditorLayout(layout: DashboardLayout, deps: ApplyEditorLayoutDeps) {
  const { canvas, components, guides, selectedId, isLoading, isDirty, clearHistory, resetViewport } =
    deps
  isLoading.value = true
  // 迁移组件: 给老组件补 dataSource/dataConfig 默认值(向后兼容)
  components.value = (layout.components ?? []).map((c) => ({
    ...c,
    dataSource: c.dataSource ?? { datasetId: null },
    dataConfig: c.dataConfig ?? {},
    style: c.style ?? {},
    visible: c.visible ?? true,
  }))
  canvas.value = { ...canvas.value, ...layout.canvas }
  guides.value = layout.guides ?? []
  selectedId.value = null
  clearHistory()
  resetViewport()
  // nextTick 后重置标志: 确保 watch 的 deep 回调(微任务)先跑完再放开
  nextTick(() => {
    isLoading.value = false
    isDirty.value = false
  })
}

/** 后端未返回 layout 时使用的空布局 */
export function emptyLayout(canvas: CanvasState): DashboardLayout {
  return {
    version: '1.0',
    components: [],
    canvas,
    guides: [],
  }
}

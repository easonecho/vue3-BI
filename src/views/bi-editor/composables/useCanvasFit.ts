import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { GuideLine } from '@/views/bi-editor/types'
import { MAX_ZOOM, MIN_ZOOM } from '@/views/bi-editor/constants/canvas-constants'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

interface CanvasFitOptions {
  store: BiEditorStore
  containerRef: Ref<HTMLElement | null>
  readonly: boolean
  /** 浏览器视口坐标 → 画布世界坐标 */
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number }
  /** 判断事件路径是否命中组件 DOM（双击组件内部时不触发 fit-to-screen） */
  eventTouchesComponent: (e: Event) => boolean
}

/** 辅助线命中容差（世界坐标 px） */
const GUIDE_HIT_TOLERANCE_PX = 8

/**
 * 🔑 画布自适应与辅助线交互。
 *
 * 从 CanvasArea 抽出：
 *   - fitToScreen：按容器尺寸计算缩放 + 居中（并派发 fit-to-screen-done）
 *   - 监听全局 `bi-editor:fit-to-screen` 事件（HeaderToolbar / 快捷键触发）
 *   - hitTestGuide：clientX/Y → 命中的辅助线
 *   - 双击辅助线删除 / 双击画布空白 fit-to-screen
 */
export function useCanvasFit(options: CanvasFitOptions) {
  const { store, containerRef, readonly, clientToWorld, eventTouchesComponent } = options

  function fitToScreen() {
    const rect = containerRef.value?.getBoundingClientRect()
    if (!rect) return
    const cw = store.canvas.width
    const ch = store.canvas.height
    // 左右/上下各留 56px 边距（给标尺/留白/滚动条空间，如果 rect 本身较小则按 4%）
    const padX = Math.min(56, Math.max(8, rect.width * 0.04))
    const padY = Math.min(64, Math.max(8, rect.height * 0.04))
    const availW = rect.width - padX * 2
    const availH = rect.height - padY * 2
    if (availW <= 20 || availH <= 20 || cw <= 0 || ch <= 0) return
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.min(availW / cw, availH / ch)),
    )
    // 居中偏移：画布中心点对齐视口中心点，换算为 scrollX/scrollY（offset layer 定位偏移）
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const sheetCx = (cw / 2) * nextZoom
    const sheetCy = (ch / 2) * nextZoom
    const nextScrollX = centerX - sheetCx
    const nextScrollY = centerY - sheetCy
    store.updateCanvas({ zoom: nextZoom, scrollX: nextScrollX, scrollY: nextScrollY })
    window.dispatchEvent(new CustomEvent('bi-editor:fit-to-screen-done'))
  }

  /** 🔑 辅助线命中考究：clientX/Y → 世界坐标 → 阈值内最近的辅助线 */
  function hitTestGuide(sx: number, sy: number): GuideLine | null {
    if (!store.canvas.showGuides || store.guides.length === 0) return null
    // 🔑 sx/sy 是浏览器视口坐标 (clientX/Y)，需先转成 viewport 相对坐标再 screenToWorld
    const { x, y } = clientToWorld(sx, sy)
    let hit: GuideLine | null = null
    let best = GUIDE_HIT_TOLERANCE_PX + 1
    for (const g of store.guides) {
      const dist = g.direction === 'vertical' ? Math.abs(g.position - x) : Math.abs(g.position - y)
      if (dist < best) {
        best = dist
        hit = g
      }
    }
    return hit
  }

  /** 容器级 dblclick：命中辅助线则删除（未命中不处理） */
  function onCanvasDblClick(e: MouseEvent) {
    if (readonly) return
    const g = hitTestGuide(e.clientX, e.clientY)
    if (!g) return
    e.stopPropagation()
    store.removeGuide(g.id)
  }

  /** sheet 级 dblclick：只有点在 sheet 空白时才 fit-to-screen（组件/辅助线交给其他逻辑） */
  function onSheetDblClick(e: MouseEvent) {
    if (eventTouchesComponent(e)) return
    // 命中辅助线：交给 onCanvasDblClick（外层 dblclick 冒泡）处理删除；此处只做 sheet 空白的 fit
    const g = hitTestGuide(e.clientX, e.clientY)
    if (g) return
    fitToScreen()
  }

  function onFitToScreenEvent() { fitToScreen() }

  onMounted(() => {
    window.addEventListener('bi-editor:fit-to-screen', onFitToScreenEvent)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('bi-editor:fit-to-screen', onFitToScreenEvent)
  })

  return { fitToScreen, hitTestGuide, onCanvasDblClick, onSheetDblClick }
}

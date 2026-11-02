import type { Ref } from 'vue'
import type { useBiEditorStore } from '@/stores/bi-editor'

export interface UseCanvasPointerDelegationDeps {
  store: ReturnType<typeof useBiEditorStore>
  isSpacePressed: Ref<boolean>
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number }
  refreshViewportRect: () => void
  startGroupDrag: (e: MouseEvent, world: { x: number; y: number }) => boolean
  startMarquee: (world: { x: number; y: number }, additive: boolean) => void
  getSuppressClick: () => boolean
}

/**
 * 🔑 判断 mousedown / click 事件路径中是否命中了组件 DOM。
 *    canvas-sheet 绑定已从 @xxx.self 改为冒泡捕获，需要手动识别「点击点真的在 sheet 空白」
 *    vs 「点击点在组件内部但由子元素 DOM 冒泡」。
 */
export function eventTouchesComponent(e: Event): boolean {
  const path: EventTarget[] =
    typeof e.composedPath === 'function' ? e.composedPath() : e.target ? [e.target] : []
  for (const node of path) {
    if (node instanceof HTMLElement) {
      // component-layout-box：CanvasComponentItem 的根 div，几何上等于组件矩形
      if (node.classList.contains('component-layout-box')) return true
      // 兜底：组件内部的 div（selection-border / wrapper-inner / component-content）
      if (
        node.classList.contains('selection-border') ||
        node.classList.contains('canvas-component-wrapper-inner') ||
        node.classList.contains('component-content')
      )
        return true
    }
  }
  return false
}

/**
 * Canvas sheet 级事件委托：
 *  - 判断事件是否命中组件 DOM
 *  - 空白区 click 清空选中
 *  - 空白区 mousedown 启动分组拖拽 / 框选
 */
export function useCanvasPointerDelegation(deps: UseCanvasPointerDelegationDeps) {
  const {
    store,
    isSpacePressed,
    clientToWorld,
    refreshViewportRect,
    startGroupDrag,
    startMarquee,
    getSuppressClick,
  } = deps

  /** 画布 click：只有点在 sheet 空白时才清空选中 */
  function handleEmptyAreaDelegation(e: MouseEvent) {
    if (eventTouchesComponent(e)) return
    handleEmptyAreaClick()
  }

  /** 画布 mousedown：只有点在 sheet 空白时才启动分组拖拽 / 框选 */
  function handleSheetMouseDownDelegation(e: MouseEvent) {
    if (eventTouchesComponent(e)) return
    handleSheetMouseDown(e)
  }

  function handleSheetMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    // pan-mode（空格键/中键平移）时不触发框选/marquee/分组拖拽
    if (isSpacePressed.value) return

    // 交互开始时缓存 viewport rect，后续 mousemove 都复用
    refreshViewportRect()

    // 优先：mousedown 在「选中分组包围盒内且未命中组员」→ 启动分组整体拖拽
    const world = clientToWorld(e.clientX, e.clientY)
    if (startGroupDrag(e, world)) return

    // Shift+拖拽：保留已有选中（additive）；否则清空
    startMarquee(world, e.shiftKey || e.ctrlKey || e.metaKey)
  }

  /** 空白处点击 → 清空选中；刚结束真实框选时 suppressClick 为 true，保留框选结果 */
  function handleEmptyAreaClick() {
    if (getSuppressClick()) return
    store.clearSelection()
  }

  return {
    handleEmptyAreaDelegation,
    handleSheetMouseDownDelegation,
    handleEmptyAreaClick,
  }
}

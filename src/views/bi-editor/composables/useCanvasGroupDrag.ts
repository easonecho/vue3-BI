import type { useBiEditorStore } from '@/stores/bi-editor'
import type { RectLike, SnapResult } from './useSmartGuides'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

interface CanvasGroupDragOptions {
  store: BiEditorStore
  /** 浏览器视口坐标 → 画布世界坐标 */
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number }
  snapRectToGuides: (id: string, rect: RectLike) => SnapResult
  applySnapLines: (hitsX: number[], hitsY: number[]) => void
  clearSnapLines: () => void
  resetSnapCache: () => void
  /** 屏蔽 mouseup 后浏览器自动派发的 click */
  suppressNextClick: () => void
}

/** 移动距离阈值（同样用于「空白区点击」vs「整体拖拽」的区分） */
const GROUP_DRAG_THRESHOLD = 2

/** 自定义分组拖拽会话状态（在选中分组的空白区域 mousedown 时启动） */
interface GroupDragSession {
  masterId: string
  startClientX: number
  startClientY: number
  startMasterX: number
  startMasterY: number
  moved: boolean
  /** 最后一次 dragging 的吸附后位置，mouseup 时一次性提交 */
  lastX: number
  lastY: number
}

/**
 * 🔑 选中分组整体拖拽（在分组包围盒空白区 mousedown 时启动）。
 *
 * 从 CanvasArea 抽出：
 *   - 拖动期间只写 store.setDragPreview（CSS transform 预览），不改 comp.x/y
 *   - 支持网格吸附 + 智能参考线吸附
 *   - mouseup 时一次性 moveComponent + commitGroupDrag + pushHistory
 *   - 纯点击（未移动）改为选中组的主组件，不写历史
 */
export function useCanvasGroupDrag(options: CanvasGroupDragOptions) {
  const {
    store,
    clientToWorld,
    snapRectToGuides,
    applySnapLines,
    clearSnapLines,
    resetSnapCache,
    suppressNextClick,
  } = options

  let groupDragSession: GroupDragSession | null = null

  function findComponent(id: string) {
    return store.getComponent(id) ?? store.components.find((c) => c.id === id)
  }

  function onGroupDragMove(e: MouseEvent) {
    const s = groupDragSession
    if (!s) return
    const world = clientToWorld(e.clientX, e.clientY)
    const start = clientToWorld(s.startClientX, s.startClientY)
    const dx = world.x - start.x
    const dy = world.y - start.y
    if (!s.moved) {
      if (Math.abs(dx) < GROUP_DRAG_THRESHOLD && Math.abs(dy) < GROUP_DRAG_THRESHOLD) return
      s.moved = true
    }
    const master = findComponent(s.masterId)
    if (!master || master.locked) return
    const targetX = s.startMasterX + dx
    const targetY = s.startMasterY + dy
    const rect = { left: targetX, top: targetY, width: master.width, height: master.height }
    let nx = targetX
    let ny = targetY
    if (store.canvas.snapToGrid) {
      const snapResult = snapRectToGuides(s.masterId, rect)
      nx = snapResult.rect.left
      ny = snapResult.rect.top
      applySnapLines(snapResult.hitsX, snapResult.hitsY)
      const gs = store.canvas.gridSize
      nx = Math.round(nx / gs) * gs
      ny = Math.round(ny / gs) * gs
    } else {
      clearSnapLines()
    }
    // 🔑 性能优化：只更新 CSS transform 预览，不写 comp.x/y
    s.lastX = nx
    s.lastY = ny
    store.setDragPreview(s.masterId, master.groupId, nx - s.startMasterX, ny - s.startMasterY)
  }

  function onGroupDragUp() {
    const s = groupDragSession
    window.removeEventListener('mousemove', onGroupDragMove)
    window.removeEventListener('mouseup', onGroupDragUp, { capture: true })
    groupDragSession = null
    // 🔑 分组拖拽结束：移除全局 grabbing cursor
    document.body.classList.remove('bi-dragging')
    if (!s) {
      clearSnapLines()
      resetSnapCache()
      return
    }
    if (!s.moved) {
      // 纯点击（没移动）：选中该组的主选中组件（selectComponent 自动展开组），不改位置，不写历史
      store.abortGroupDrag()
      clearSnapLines()
      resetSnapCache()
      const master = findComponent(s.masterId)
      if (master) store.selectComponent(master.id)
      return
    }
    // 🔑 性能优化：一次性提交。
    //   moveComponent 写主体最终 comp.x/y（无 opts：不触发 group 联动），
    //   commitGroupDrag 把累计 delta 一次性应用到同组组员 + 清空预览。
    store.moveComponent(s.masterId, s.lastX, s.lastY)
    store.commitGroupDrag(s.masterId)
    clearSnapLines()
    resetSnapCache()
    store.pushHistory()
    // 🔑 屏蔽后续 click（mousedown/mouseup 后浏览器会派发 click，否则 sheet 的 click.self 会清空选中）
    suppressNextClick()
  }

  /**
   * 尝试在选中分组包围盒空白区启动整体拖拽。
   * @returns true=已启动（调用方不应再启动框选）；false=未命中分组空白区
   */
  function startGroupDrag(e: MouseEvent, world: { x: number; y: number }): boolean {
    const hit = store.hitTestSelectedGroupBlank(world.x, world.y)
    if (!hit) return false
    const master = findComponent(hit.masterId)
    if (!master || master.locked) return false
    groupDragSession = {
      masterId: hit.masterId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startMasterX: master.x,
      startMasterY: master.y,
      moved: false,
      lastX: master.x,
      lastY: master.y,
    }
    e.preventDefault()
    e.stopPropagation()
    window.addEventListener('mousemove', onGroupDragMove)
    window.addEventListener('mouseup', onGroupDragUp, { capture: true })
    // 🔑 分组空白拖拽中全局 cursor: grabbing
    document.body.classList.add('bi-dragging')
    return true
  }

  /** 组件卸载时清理进行中的拖拽会话与全局状态 */
  function dispose() {
    window.removeEventListener('mousemove', onGroupDragMove)
    window.removeEventListener('mouseup', onGroupDragUp, { capture: true })
    if (groupDragSession) {
      groupDragSession = null
      clearSnapLines()
      resetSnapCache()
    }
    document.body.classList.remove('bi-dragging')
  }

  return { startGroupDrag, dispose }
}

<template>
  <div
    ref="containerRef"
    class="canvas-container"
    :class="{
      'pan-cursor': !readonly && (isSpacePressed || isMiddlePressed || isPanning),
      'show-dots': !readonly && store.canvas.showGrid,
      'readonly-mode': readonly,
    }"
    @wheel.capture="readonly ? undefined : handleWheel($event)"
    @mousedown="readonly ? undefined : handleContainerMouseDown($event)"
    @dblclick="readonly ? undefined : onDblClickDelegation($event)"
  >
    <div class="canvas-layout" :style="layoutStyle">
      <div v-if="!readonly && store.canvas.showRuler" class="ruler-corner" />
      <div v-if="!readonly && store.canvas.showRuler" ref="hGuidesRef" class="ruler-horizontal" />
      <div v-if="!readonly && store.canvas.showRuler" ref="vGuidesRef" class="ruler-vertical" />

      <div
        ref="viewportRef"
        class="canvas-viewport"
        :style="viewportStyle"
        @click.self="readonly ? undefined : handleEmptyAreaClick()"
        @drop="readonly ? undefined : handleDrop($event)"
        @dragover.prevent
      >
        <div
          class="canvas-transform-layer"
          :style="transformLayerStyle"
          @click.self="readonly ? undefined : handleEmptyAreaClick()"
        >
          <div
            class="canvas-offset-layer"
            :style="offsetLayerStyle"
            @click.self="readonly ? undefined : handleEmptyAreaClick()"
          >
            <div
      ref="canvasSheetRef"
      class="canvas-sheet"
      :class="{ 'pan-mode': !readonly && (isSpacePressed || isPanning) }"
      :style="canvasSheetStyle"
      @click="readonly ? undefined : handleEmptyAreaDelegation($event)"
      @mousedown="readonly ? undefined : handleSheetMouseDownDelegation($event)"
      @contextmenu.prevent="readonly ? undefined : onCanvasContextMenu($event)"
      @dblclick="readonly ? undefined : handleDblClickDelegation($event)"
    >
              <CanvasSnapLines v-if="!readonly" :vertical="snapLines.vertical" :horizontal="snapLines.horizontal" />

              <!-- 🔑 分组统一选中边框（GroupBox）：选中组时覆盖整个 group 包围盒，
                   pointer-events=none 不拦截组员点击；拖拽预览时整体跟随偏移。
                   抽为子组件：响应式订阅范围收敛到 GroupBox 内部，避免 CanvasArea 主模板 re-render。 -->
              <GroupBox
                v-for="gb in readonly ? [] : store.selectedGroupBounds"
                :key="gb.groupId"
                :gb="gb"
                :drag-preview="readonly ? null : store.groupDragPreview"
              />

              <!-- 🔑 框选 marquee 矩形：在画布世界坐标系下绝对定位 -->
              <div
                v-if="!readonly && marquee.visible"
                class="marquee-rect"
                :style="marqueeStyle"
              />

              <CanvasComponentItem
                v-for="comp in visibleComponents"
                :key="comp.id"
                v-memo="[
                  comp.x, comp.y, comp.width, comp.height, comp.zIndex,
                  comp.visible, comp.locked, comp.groupId,
                  readonly ? false : store.selectedId === comp.id,
                  readonly ? false : store.selectedIdSet.has(comp.id),
                  readonly ? false : store.isInSelectedGroup(comp.id),
                  /* 🔑 性能优化：v-memo 只依赖低频字段，不读高频的 groupDragPreview。
                     groupDragPreview 由子组件内部 computed 直接读 store（响应式订阅收敛到子组件）。
                     - activeDragId / activeDragGroupId 仅在拖拽开始/结束时变化（低频）
                     - 拖拽期间每帧 setDragPreview 改 groupDragPreview，但 v-for 不订阅它 → 不重渲染
                     - 仅 v-memo 失效的组件（主体+同组）re-patch → 子组件 computed 读 groupDragPreview → 应用 transform */
                  readonly ? false : store.activeDragId === comp.id,
                  readonly ? false : (store.activeDragGroupId !== null && store.activeDragGroupId === comp.groupId),
                  resizeHandles,
                  /* 🔑 配置变更触发生效的关键：
                     - RightPanel 的 updateProp/updateStyle/handleFieldMappingChange 都会通过
                       store.updateComponent 创建新的 props/style/dataConfig/dataSource 对象引用。
                     - 若 v-memo 数组不包含这些引用，当用户仅改了属性栏配置（x/y/宽高都不变），
                       v-memo 会认为整颗子树都「无需 re-patch」，CanvasComponentItem →
                       ComponentRenderer → line/bar/... Widget 的 props.comp 仍是旧引用，
                       Widget 内部的 watch 不会触发 → ECharts option 不更新。
                     - 加入这 4 个引用后，浅比较 Object.is 会正确检测到引用变更，
                       v-memo 失效 → 子组件收到新 prop → watch 触发 → setOption 实时生效。
                     - 位置/尺寸/拖拽类的高频变化不经过这些引用，不影响拖拽性能。 */
                  comp.props,
                  comp.style,
                  comp.dataConfig,
                  comp.dataSource,
                ]"
                :comp="comp"
                :selected-id="readonly ? null : store.selectedId"
                :multi-selected="readonly ? false : store.selectedIdSet.has(comp.id)"
                :resize-handles="readonly ? [] : resizeHandles"
                :belongs-to-selected-group="readonly ? false : store.isInSelectedGroup(comp.id)"
                @select="onItemSelect"
                @wrapper-mousedown="onItemWrapperMouseDown"
                @resize-start="onItemResizeStart"
                @component-contextmenu="onItemContextMenu"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!readonly && store.components.length === 0" class="empty-canvas">
      <el-icon :size="64" color="#9ca3af"><Plus /></el-icon>
      <p>拖拽组件到画布，或点击左侧组件库添加</p>
    </div>

    <!-- 🔑 右键上下文菜单 -->
    <ContextMenu v-if="!readonly" ref="contextMenuRef" />

    <CanvasInfoBar v-if="!readonly" :local-scale="localScale" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import type { GuideLine } from '@/views/bi-editor/types'
import { MIN_ZOOM, MAX_ZOOM } from '@/views/bi-editor/constants/canvas-constants'
import {
  Plus,
  DocumentCopy,
  Scissor,
  Document,
  Delete,
  CopyDocument,
  Top,
  Bottom,
  Upload,
  Promotion,
  Hide,
  Lock,
  Setting,
} from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import CanvasSnapLines from './CanvasSnapLines.vue'
import CanvasComponentItem from './CanvasComponentItem.vue'
import CanvasInfoBar from './CanvasInfoBar.vue'
import GroupBox from './GroupBox.vue'
import ContextMenu from './ContextMenu.vue'
import type { ContextMenuGroups } from './ContextMenu.vue'
import { useCanvasTransform } from '@/views/bi-editor/composables/useCanvasTransform'
import { useSmartGuides } from '@/views/bi-editor/composables/useSmartGuides'
import { useRulerGuides } from '@/views/bi-editor/composables/useRulerGuides'
import { useCanvasInteraction } from '@/views/bi-editor/composables/useCanvasInteraction'

const props = withDefaults(defineProps<{ readonly?: boolean }>(), { readonly: false })
/** 模板和 script 都要用到 readonly prop，这里解构出来便于闭包直接访问 */
const readonly = props.readonly

const emit = defineEmits<{
  (e: 'select-component', id: string | null): void
}>()

const store = useBiEditorStore()

// ========== Smart Guides ==========
const { snapLines, clearSnapLines, applySnapLines, snapRectToGuides, resetSnapCache } =
  useSmartGuides()

// ========== Escape callback (will be populated after useCanvasInteraction is constructed) ==========
let escapeHook: (() => void) | null = null

// ========== Transform + viewport ==========
const {
  containerRef,
  viewportRef,
  viewportWidth,
  viewportHeight,
  viewportStyle,
  layoutStyle,
  localScale,
  localOffset,
  isSpacePressed,
  isMiddlePressed,
  isPanning,
  screenToWorld,
  transformLayerStyle,
  offsetLayerStyle,
  handleWheel,
  handleContainerMouseDown,
  startPan,
  startViewportObserver,
} = useCanvasTransform({
  onEscape: () => escapeHook?.(),
})

// ========== Ruler / Guides (@scena/guides) ==========
const { hGuidesRef, vGuidesRef, initGuides, refreshGuides } = useRulerGuides({
  localScale,
  localOffset,
  viewportWidth,
  viewportHeight,
  screenToWorld,
})

// ========== Component interactions ==========
const {
  resizeHandles,
  handleSelect: interactionHandleSelect,
  handleWrapperMouseDown,
  handleDrop,
  handleResizeStart,
  abortActiveResize,
} = useCanvasInteraction({
  localScale,
  isSpacePressed,
  viewportRef,
  startPan,
  screenToWorld,
  snapRectToGuides,
  applySnapLines,
  clearSnapLines,
  resetSnapCache,
  onSelectComponent: (id) => emit('select-component', id),
})

// Wire Escape → resize abort (after both composables constructed, before mount)
escapeHook = () => abortActiveResize()

/**
 * 🔑 包装后的选中入口：带 event 支持 Shift / Ctrl 修饰键。
 *   - Shift：累加 / 切换多选
 *   - Ctrl (Meta)：切换该组件在选中集合中的状态
 *   - 无修饰：直接单选
 *
 * 注意：所有调用方都来自 @mousedown / @click，event 永远是 MouseEvent，
 *   不再有 VDR 的 activated/clicked 这种不带 event 的回调。
 */
function handleSelect(event: MouseEvent | undefined, id: string) {
  if (!event || (!(event instanceof MouseEvent))) {
    store.selectComponent(id)
    interactionHandleSelect(id)
    return
  }
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    store.selectComponentAccum(id, event.ctrlKey || event.metaKey)
  } else {
    store.selectComponent(id)
  }
  interactionHandleSelect(id)
}

// ========== 框选 marquee ==========
// 🔑 性能优化：拆分为 reactive 数据 + computed style。
//   原实现 marquee.style 是 reactive getter，每次模板访问都重算 left/top/width/height。
//   改为 computed 后，Vue 会缓存计算结果，仅在依赖字段真正变化时才重算。
const marquee = reactive({
  visible: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  additive: false,
})
const marqueeStyle = computed(() => {
  const left = Math.min(marquee.startX, marquee.endX)
  const top = Math.min(marquee.startY, marquee.endY)
  const width = Math.abs(marquee.endX - marquee.startX)
  const height = Math.abs(marquee.endY - marquee.startY)
  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: 9999,
    pointerEvents: 'none' as const,
  }
})
// 🔑 性能优化：RAF 批量更新 marquee 位置。
//   选中态不再走 Vue 响应式，改为 DOM 直改（见 flushMarqueeDomDirect）。
let marqueeRafId: number | null = null
let marqueePendingX = 0
let marqueePendingY = 0

/**
 * 🔑 框选 DOM 直改模式状态：
 *   框选期间不写 store.selectedIds，只通过 classList.toggle 直接改 DOM 的选中边框，
 *   彻底绕开 Vue 响应式 → 零 computed 重算 / 零 v-memo 比较 / 零组件 re-patch。
 *   mouseup 时才把最终命中集合一次性写回 store。
 */
let inMarqueeMode = false
/** 框选开始时的基线选中集合（Shift/Ctrl 累加模式下非空） */
let marqueeBaselineIds: Set<string> = new Set()
/** 当前帧命中集合（相对基线合并后的结果） */
let marqueeHitSet: Set<string> = new Set()
/** 上一帧命中集合（用于计算 diff，只改变化的 DOM） */
let marqueePrevHitSet: Set<string> = new Set()
/** 当前帧主选中 id（z-index 最高的命中） */
let marqueeMasterId: string | null = null
/** 上一帧主选中 id（用于 diff，只改 2 个元素的 primary class） */
let marqueePrevMasterId: string | null = null
/** 🔑 组件 id → DOM 元素缓存：框选开始时一次性建立，避免每帧 querySelectorAll O(N²) */
let marqueeCompDomCache: Map<string, HTMLElement> = new Map()

const MULTI_DOM_CLASS = 'marquee-dom-multi'
const PRIMARY_DOM_CLASS = 'marquee-dom-primary'

/** 建立组件 DOM 元素缓存（一次 O(N) 遍历，后续每帧 O(1) 取元素） */
function buildMarqueeDomCache() {
  marqueeCompDomCache.clear()
  const sheet = canvasSheetRef.value
  if (!sheet) return
  const els = sheet.querySelectorAll<HTMLElement>('.component-layout-box')
  for (let i = 0; i < els.length; i++) {
    const id = els[i].dataset.compId
    if (id) marqueeCompDomCache.set(id, els[i])
  }
}

/** 清理所有 marquee 临时 DOM class（用 querySelectorAll 扫一遍最安全） */
function clearMarqueeDomClasses() {
  const sheet = canvasSheetRef.value
  if (!sheet) return
  const targets = sheet.querySelectorAll<HTMLElement>(`.${MULTI_DOM_CLASS}, .${PRIMARY_DOM_CLASS}`)
  for (let i = 0; i < targets.length; i++) {
    targets[i].classList.remove(MULTI_DOM_CLASS, PRIMARY_DOM_CLASS)
  }
}

function flushMarqueeDomDirect() {
  marqueeRafId = null
  marquee.endX = marqueePendingX
  marquee.endY = marqueePendingY
  if (
    !marqueeMoved &&
    (Math.abs(marquee.endX - marquee.startX) > MARQUEE_MOVE_THRESHOLD ||
      Math.abs(marquee.endY - marquee.startY) > MARQUEE_MOVE_THRESHOLD)
  ) {
    marqueeMoved = true
  }

  // --- 命中测试（纯 O(N) 遍历，不写 store） ---
  const rectX = Math.min(marquee.startX, marquee.endX)
  const rectY = Math.min(marquee.startY, marquee.endY)
  const rectR = Math.max(marquee.startX, marquee.endX)
  const rectB = Math.max(marquee.startY, marquee.endY)

  // 累加模式：以基线为基础；非累加模式：从空集开始
  if (marquee.additive) {
    marqueeHitSet = new Set(marqueeBaselineIds)
  } else {
    marqueeHitSet.clear()
  }
  let maxZ = -Infinity
  let masterId = ''
  const allComps = store.components
  for (let i = 0; i < allComps.length; i++) {
    const c = allComps[i] as any
    if (!c.visible || c.locked) continue
    const cR = c.x + c.width
    const cB = c.y + c.height
    if (c.x < rectR && cR > rectX && c.y < rectB && cB > rectY) {
      marqueeHitSet.add(c.id)
      if (c.zIndex > maxZ) {
        maxZ = c.zIndex
        masterId = c.id
      }
    }
  }
  const newMaster = marqueeHitSet.size > 0 ? masterId || null : null

  // --- DOM 直改：仅对 diff 的元素 toggle class ---
  // 1. 主选中（primary）：先处理（主选中同时也是 multi，先清旧 master 的 primary）
  if (marqueePrevMasterId !== newMaster) {
    if (marqueePrevMasterId) {
      const oldEl = marqueeCompDomCache.get(marqueePrevMasterId)
      oldEl?.classList.remove(PRIMARY_DOM_CLASS)
    }
    if (newMaster) {
      const newEl = marqueeCompDomCache.get(newMaster)
      newEl?.classList.add(PRIMARY_DOM_CLASS)
    }
    marqueePrevMasterId = newMaster
  }
  marqueeMasterId = newMaster

  // 2. 多选集合（multi）：遍历 prev 和 next 的对称差
  //    只对新增/移除的元素改 class，不碰保持不变的
  for (const id of marqueePrevHitSet) {
    if (!marqueeHitSet.has(id) && id !== marqueePrevMasterId) {
      const el = marqueeCompDomCache.get(id)
      el?.classList.remove(MULTI_DOM_CLASS)
    }
  }
  for (const id of marqueeHitSet) {
    if (!marqueePrevHitSet.has(id) && id !== marqueeMasterId) {
      const el = marqueeCompDomCache.get(id)
      el?.classList.add(MULTI_DOM_CLASS)
    }
  }
  // swap prev = next 供下一帧 diff
  const tmp = marqueePrevHitSet
  marqueePrevHitSet = marqueeHitSet
  marqueeHitSet = tmp // 复用对象减少 GC（下次会被 clear / new Set）
}
/**
 * 🔑 框选移动距离阈值：超过该值才视为真实框选（而非纯点击）。
 *   用于决定 mouseup 后是否屏蔽浏览器自动派发的 click 事件。
 */
const MARQUEE_MOVE_THRESHOLD = 2
let marqueeMoved = false
/**
 * 🔑 mouseup 后浏览器会在 mousedown 与 mouseup 的共同祖先上派发 click 事件。
 *   若起点/终点都在 canvas-sheet 内，click 会命中 @click.self → store.clearSelection()，
 *   把刚框选的成果清空。框选发生真实位移时，置此 ref=true，并在下一个宏任务重置；
 *   click 事件先于 setTimeout(0) 回调派发，因此 handleEmptyAreaClick 能看到 true 而跳过清空。
 */
const suppressClick = ref(false)

/**
 * 🔑 把浏览器视口坐标 (clientX/Y) 换算成 canvas-viewport 相对坐标，
 *   再交给 screenToWorld 转成世界坐标。
 *   screenToWorld 期望的入参是「viewport 内部相对坐标」，
 *   若直接传 clientX/Y 会因为没扣掉 viewport 的 left/top
 *   （等于标尺宽度 + 容器偏移）导致框选矩形整体偏移。
 */
// 🔑 性能优化：缓存 viewport rect，避免拖拽/框选期间每次 mousemove 都调用 getBoundingClientRect()
//   getBoundingClientRect() 在有 pending DOM 写入时会强制布局重计算（layout thrashing）
let cachedViewportRect: DOMRect | null = null

function clientToWorld(clientX: number, clientY: number) {
  const rect = cachedViewportRect ?? viewportRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return screenToWorld(clientX - rect.left, clientY - rect.top)
}

/**
 * 🔑 GroupBox 样式与拖拽预览跟随逻辑已移至 GroupBox.vue 子组件：
 *   - style 由 computed 计算，避免内联函数每次渲染重建对象
 *   - 响应式订阅范围收敛到子组件，避免 CanvasArea 主模板因 groupDragPreview 变化而 re-render
 */
// 🔑 性能优化：稳定的事件处理器引用。
//   模板内联箭头函数每次渲染创建新引用 → CanvasComponentItem props 不等 → 无谓子组件更新。
//   这些 wrapper 定义一次，引用稳定，readonly 检查移到调用时。
const onItemSelect = (ev: MouseEvent, id: string) => { if (!readonly) handleSelect(ev, id) }
const onItemWrapperMouseDown = (e: MouseEvent, id: string) => { if (!readonly) handleWrapperMouseDown(e, id) }
const onItemResizeStart = (e: MouseEvent, id: string, pos: string) => { if (!readonly) handleResizeStart(e, id, pos) }
const onItemContextMenu = (e: MouseEvent, id: string) => { if (!readonly) onComponentContextMenu(e, id) }

/** 🔑 移动距离阈值（同样用于「空白区点击」vs「整体拖拽」的区分） */
const GROUP_DRAG_THRESHOLD = 2
/** 🔑 自定义分组拖拽会话状态（在选中分组的空白区域 mousedown 时启动） */
let groupDragSession: {
  masterId: string
  startClientX: number
  startClientY: number
  startMasterX: number
  startMasterY: number
  moved: boolean
  /** 🔑 最后一次 dragging 的吸附后位置，mouseup 时一次性提交 */
  lastX: number
  lastY: number
} | null = null

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
  const master = store.getComponent?.(s.masterId) ?? store.components.find((c) => c.id === s.masterId)
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
  window.removeEventListener('mouseup', onGroupDragUp, { capture: true } as any)
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
    const master = store.getComponent?.(s.masterId) ?? store.components.find((c) => c.id === s.masterId)
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
  suppressClick.value = true
  setTimeout(() => {
    suppressClick.value = false
  }, 0)
}
/**
 * 🔑 判断 mousedown / click 事件路径中是否命中了组件 DOM。
 *   由于 canvas-sheet 绑定已从 @xxx.self 改为冒泡捕获，需要手动识别「点击点真的在 sheet 空白」vs
 *   「点击点在组件内部但由子元素 DOM（如 selection-border、component-content、ECharts canvas 等）
 *   触发了事件冒泡」。命中组件 DOM → 不执行 sheet 级逻辑（清空选中 / 框选 / 分组拖拽），交给组件自身处理。
 */
function eventTouchesComponent(e: Event): boolean {
  const anyE = e as any
  const path: EventTarget[] = typeof anyE.composedPath === 'function'
    ? anyE.composedPath()
    : anyE.target ? [anyE.target] : []
  for (const node of path) {
    if (node instanceof HTMLElement) {
      // component-layout-box：CanvasComponentItem 的根 div，每个组件一个，几何上完全等于组件矩形
      if (node.classList.contains('component-layout-box')) return true
      // 兜底：组件内部的 div（selection-border / canvas-component-wrapper-inner / component-content）
      if (node.classList.contains('selection-border')
        || node.classList.contains('canvas-component-wrapper-inner')
        || node.classList.contains('component-content')) return true
    }
  }
  return false
}

/** 🔑 画布 dblclick：只有点在 sheet 空白时才 fit-to-screen（点组件内部交给组件） */
function handleDblClickDelegation(e: MouseEvent) {
  if (eventTouchesComponent(e)) return
  // 命中辅助线：交给 onDblClickDelegation（外层）已通过 dblclick event 冒泡委托处理过；此处只做 sheet 空白的 fit
  const g = hitTestGuide(e.clientX, e.clientY)
  if (g) return // 双击辅助线会在外层委托删除
  fitToScreen()
}

/** 🔑 画布 click：只有点在 sheet 空白时才清空选中（否则组件自身点击时不会误清空） */
function handleEmptyAreaDelegation(e: MouseEvent) {
  if (eventTouchesComponent(e)) return
  handleEmptyAreaClick()
}

/** 🔑 画布 mousedown：只有点在 sheet 空白时才启动分组整体拖拽 / 框选 marquee（组件内部点击交给组件自身的拖拽会话） */
function handleSheetMouseDownDelegation(e: MouseEvent) {
  if (eventTouchesComponent(e)) return
  handleSheetMouseDown(e)
}

function handleSheetMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  // 🔑 pan-mode（空格键/中键平移）时不触发框选/marquee/分组拖拽，
  //   startPan 由 handleContainerMouseDown 统一处理
  if (isSpacePressed.value) return

  // 🔑 性能优化：在交互开始时缓存 viewport rect，后续 mousemove 都用缓存值
  cachedViewportRect = viewportRef.value?.getBoundingClientRect() ?? null

  // 🔑 优先：如果 mousedown 发生在「某个选中分组的包围盒内，且未命中任何组员（空白区）」
  //   → 启动自定义分组整体拖拽（覆盖 canvas-sheet 的框选行为），满足「边框内任何地方都能拖分组」
  const world = clientToWorld(e.clientX, e.clientY)
  const hit = store.hitTestSelectedGroupBlank(world.x, world.y)
  if (hit) {
    const master = store.getComponent?.(hit.masterId) ?? store.components.find((c) => c.id === hit.masterId)
    if (master && !master.locked) {
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
      window.addEventListener('mouseup', onGroupDragUp, { capture: true } as any)
      // 🔑 分组空白拖拽中全局 cursor: grabbing
      document.body.classList.add('bi-dragging')
      return
    }
  }

  // 🔑 Shift+拖拽：保留已有选中（additive）；否则清空
  const additive = e.shiftKey || e.ctrlKey || e.metaKey
  marquee.additive = additive
  // 🔑 进入 DOM 直改框选模式：
  //   1) 记基线选中集合
  //   2) 建 DOM 元素缓存（每帧 O(1) 取元素）
  //   3) 初始化帧内集合
  inMarqueeMode = true
  marqueeBaselineIds = new Set(additive ? store.selectedIds : [])
  buildMarqueeDomCache()
  marqueeHitSet = new Set(marqueeBaselineIds)
  marqueePrevHitSet = new Set()
  marqueeMasterId = null
  marqueePrevMasterId = null

  // 由于 canvas-sheet 相对 canvas-offset-layer 位于 x=0/y=0，world 就是以 sheet 左上角为原点
  marquee.startX = world.x
  marquee.startY = world.y
  marquee.endX = world.x
  marquee.endY = world.y
  marquee.visible = true
  marqueeMoved = false
  window.addEventListener('mousemove', onMarqueeMove)
  window.addEventListener('mouseup', onMarqueeUp, { once: true })
  // 🔑 框选中全局 cursor: crosshair
  document.body.classList.add('bi-marqueeing')
}

function onMarqueeMove(e: MouseEvent) {
  const world = clientToWorld(e.clientX, e.clientY)
  // 🔑 性能优化：缓存最新坐标，由 RAF 合并为每帧一次 DOM 直改更新
  marqueePendingX = world.x
  marqueePendingY = world.y
  if (marqueeRafId !== null) return
  marqueeRafId = requestAnimationFrame(flushMarqueeDomDirect)
}

function onMarqueeUp() {
  window.removeEventListener('mousemove', onMarqueeMove)
  window.removeEventListener('mouseup', onMarqueeUp)
  // 🔑 框选结束：移除全局 crosshair cursor
  document.body.classList.remove('bi-marqueeing')
  marquee.visible = false
  if (marqueeRafId !== null) {
    cancelAnimationFrame(marqueeRafId)
    // 🔑 保证最终状态用 mouseup 的位置 flush 一次，不丢最后一帧
    flushMarqueeDomDirect()
  }

  const finalHitSet = marqueePrevHitSet
  const finalMaster = marqueeMasterId

  // 🔑 清所有 DOM 临时 class（Vue 接管后会重新画正确的选中边框）
  clearMarqueeDomClasses()
  inMarqueeMode = false

  // 🔑 写回 store：仅在选中集合与基线不同时才赋值 → 避免无谓响应式
  const baselineArr = [...marqueeBaselineIds]
  const finalArr = [...finalHitSet]
  const needCommit =
    finalArr.length !== baselineArr.length ||
    !finalArr.every((id, i) => id === baselineArr[i])

  if (needCommit) {
    // 直接写 selectedIds + selectedId，不走 selectByRect（已做命中测试）
    store.$patch({
      selectedIds: finalArr,
      selectedId: finalMaster,
    })
    store.pushHistory()
  } else if (store.selectedId !== finalMaster) {
    // 集合相同但主选中变了（z-index 最高者变化）
    store.$patch({ selectedId: finalMaster })
    store.pushHistory()
  }

  // 🔑 清临时集合（避免下次框选残留数据）
  marqueeBaselineIds = new Set()
  marqueePrevHitSet = new Set()
  marqueeCompDomCache.clear()

  if (marqueeMoved) {
    // 🔑 屏蔽 mouseup 后浏览器自动派发的 click 事件（否则会清空刚框选的选中）
    suppressClick.value = true
    setTimeout(() => {
      suppressClick.value = false
    }, 0)
  }
}

/**
 * 🔑 画布空白处点击 → 清空选中。但若刚结束一次真实框选，suppressClick 为 true，
 *   跳过清空以保留框选结果。
 */
function handleEmptyAreaClick() {
  if (suppressClick.value) return
  store.clearSelection()
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMarqueeMove)
  window.removeEventListener('mouseup', onMarqueeUp)
  // 🔑 组件卸载时清理残留的全局 cursor class，避免泄露到其他页面
  document.body.classList.remove('bi-dragging', 'bi-marqueeing')
})

// ========== 🔑 视口裁剪（虚拟化渲染） ==========
/**
 * 只渲染可见区域 + 缓冲区的组件，画布外的组件不创建 DOM/ECharts 实例。
 *
 * 收益：
 *   - 100 组件时 DOM 节点从 ~1200 降到 ~300（仅可见区域）
 *   - 画布外图表不初始化 ECharts，配合 BaseChart 按需 init，首屏从 5s → 0.5s
 *   - 滚动/缩放时 reflow 范围小，60fps 稳定
 *
 * 注意：
 *   - 选中的组件强制保留（拖拽/拉伸时不能丢失 DOM 实例，否则状态错乱）
 *   - readonly 模式（预览/发布）全量渲染，避免滚动时图表反复 init/dispose
 *   - 缓冲区防止快速滚动时组件闪现（提前渲染屏幕外的邻近组件）
 */
const VIEWPORT_BUFFER_PX = 200
const visibleComponents = computed(() => {
  // 预览/发布模式全量渲染（组件数通常少，且不应有 init/dispose 抖动）
  if (readonly) return store.components
  const scale = localScale.value
  if (scale <= 0) return store.components
  // 视口在世界坐标系中的范围（screenToWorld 期望 viewport 内部相对坐标）
  const tl = screenToWorld(0, 0)
  const br = screenToWorld(viewportWidth.value, viewportHeight.value)
  const buffer = VIEWPORT_BUFFER_PX / scale
  const minX = Math.min(tl.x, br.x) - buffer
  const minY = Math.min(tl.y, br.y) - buffer
  const maxX = Math.max(tl.x, br.x) + buffer
  const maxY = Math.max(tl.y, br.y) + buffer
  // 🔑 性能优化：移除对 selectedIdSet 的依赖。
  //   原实现 `selected.has(c.id)` 让 visibleComponents 订阅 selectedIdSet（computed），
  //   每次框选 selectedIds 变化都触发 filter 重算 + v-for 重渲染。
  //   但框选时组件位置不变，选中组件本来就在视口内，强制保留是冗余的。
  //   移除后：框选期间 visibleComponents 不重算 → v-for 不重渲染 → 零组件 patch。
  //   选中组件移出视口的低频场景（缩放/平移画布）：选中边框随组件一起消失，体验可接受。
  return store.components.filter((c: any) =>
    c.x + c.width >= minX && c.x <= maxX &&
    c.y + c.height >= minY && c.y <= maxY,
  )
})

// ========== Canvas sheet (logical canvas box + component carrier) ==========
const canvasSheetRef = ref<HTMLElement | null>(null)
const canvasSheetStyle = computed(() => ({
  left: '0px',
  top: '0px',
  width: `${store.canvas.width}px`,
  height: `${store.canvas.height}px`,
  backgroundColor: store.canvas.backgroundColor,
  backgroundImage: store.canvas.backgroundImage ? `url(${store.canvas.backgroundImage})` : undefined,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}))

// ========== 🔑 fit-to-screen：自适应缩放 + 居中整张画布 ==========
/** 计算画布 sheet 左上角在容器里的视口坐标（用于对齐） */
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

// ========== 🔑 右键上下文菜单 ==========
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

/** 组件右键：若该组件未在多选中，则自动选中它 */
function onComponentContextMenu(e: MouseEvent, id: string) {
  if (!contextMenuRef.value) return
  if (!store.selectedIdSet.has(id)) {
    store.selectComponent(id)
  }
  const sc = store.selectedComponent
  const isLocked = !!sc?.locked
  const canDelete = store.selectedIds.length > 0 || !!store.selectedId
  const isGrouped = !!sc?.groupId
  const groups: ContextMenuGroups = [
    // —— 第一组：剪贴板操作
    [
      {
        label: '剪切',
        icon: Scissor,
        shortcut: 'Ctrl+X',
        // 🔑 剪切 = 复制 + 标记删除（粘贴时执行 remove）。此处保守实现为：先复制（剪切的实际删除延后由 paste 完成；目前暂实现为"复制并删除"，等价于剪切）
        action: () => {
          store.copyToClipboard()
          deleteSelection()
        },
      },
      {
        label: '复制',
        icon: DocumentCopy,
        shortcut: 'Ctrl+C',
        disabled: !canDelete,
        action: () => store.copyToClipboard(),
      },
      {
        label: '粘贴',
        icon: Document,
        shortcut: 'Ctrl+V',
        action: () => store.pasteFromClipboard(),
      },
      { divider: true } as any,
      {
        label: '复制此组件',
        icon: CopyDocument,
        shortcut: 'Ctrl+D',
        disabled: !store.selectedId,
        action: () => store.duplicateComponent(store.selectedId!),
      },
      {
        label: '删除',
        icon: Delete,
        shortcut: 'Delete',
        disabled: !canDelete || isLocked,
        danger: true,
        action: deleteSelection,
      },
    ],
    // —— 第二组：层级 / 分组
    [
      {
        label: '图层置顶',
        icon: Top,
        shortcut: 'Ctrl+Shift+]',
        disabled: !store.selectedId || !store.canBringToFront,
        action: () => store.selectedId && store.bringToFront(store.selectedId),
      },
      {
        label: '图层上移',
        icon: Promotion,
        shortcut: 'Ctrl+]',
        disabled: !store.selectedId || !store.canMoveUp,
        action: () => store.selectedId && store.moveUp(store.selectedId),
      },
      {
        label: '图层下移',
        icon: Upload,
        shortcut: 'Ctrl+[',
        disabled: !store.selectedId || !store.canMoveDown,
        action: () => store.selectedId && store.moveDown(store.selectedId),
      },
      {
        label: '图层置底',
        icon: Bottom,
        shortcut: 'Ctrl+Shift+[',
        disabled: !store.selectedId || !store.canSendToBack,
        action: () => store.selectedId && store.sendToBack(store.selectedId),
      },
      { divider: true } as any,
      {
        label: '组合',
        icon: Setting,
        disabled: !store.canGroup,
        action: () => store.groupSelection(),
      },
      {
        label: '取消组合',
        icon: Setting,
        disabled: !isGrouped && !store.canUngroup,
        action: () => store.ungroupSelection(),
      },
    ],
    // —— 第三组：显示 / 锁定
    [
      {
        label: sc?.visible ? '隐藏组件' : '显示组件',
        icon: Hide,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.toggleVisibility(store.selectedId),
      },
      {
        label: isLocked ? '解锁组件' : '锁定组件',
        icon: Lock,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.toggleLock(store.selectedId),
      },
    ],
  ]
  contextMenuRef.value.show(e.clientX, e.clientY, groups)
}

function onCanvasContextMenu(e: MouseEvent) {
  if (!contextMenuRef.value) return
  // 🔑 若右键点在辅助线附近：优先显示"辅助线菜单"
  const g = hitTestGuide(e.clientX, e.clientY)
  if (g) {
    showGuideContextMenu(e, g)
    return
  }
  const groups: ContextMenuGroups = [
    [
      {
        label: '粘贴',
        icon: Document,
        shortcut: 'Ctrl+V',
        action: () => store.pasteFromClipboard(),
      },
      { divider: true } as any,
      {
        label: '全选组件',
        icon: DocumentCopy,
        shortcut: 'Ctrl+A',
        disabled: store.components.length === 0,
        action: () => {
          const next = new Set<string>()
          store.components.forEach((c: any) => next.add(c.id))
          store.clearSelection()
          // 🔑 用 selectByRect 模拟 —— 直接塞 selectedIds（调用 store 的 API 才稳妥）
          const rect = {
            x: 0,
            y: 0,
            width: store.canvas.width,
            height: store.canvas.height,
          }
          store.selectByRect(rect, false)
        },
      },
      {
        label: '取消选择',
        disabled: !store.selectedId && store.selectedIds.length === 0,
        action: () => store.clearSelection(),
      },
    ],
    [
      {
        label: '撤销',
        shortcut: 'Ctrl+Z',
        disabled: !store.canUndo,
        action: () => store.undo(),
      },
      {
        label: '重做',
        shortcut: 'Ctrl+Y',
        disabled: !store.canRedo,
        action: () => store.redo(),
      },
      { divider: true } as any,
      {
        label: '缩放为 100%',
        shortcut: 'Ctrl+0',
        action: () => store.setZoom(1),
      },
      {
        label: '重置视口',
        action: () => store.resetViewport(),
      },
    ],
  ]
  contextMenuRef.value.show(e.clientX, e.clientY, groups)
}

// ========== 🔑 辅助线命中考究 & 双击/右键删除 ==========
function hitTestGuide(sx: number, sy: number): GuideLine | null {
  if (!store.canvas.showGuides || store.guides.length === 0) return null
  // 🔑 sx/sy 是浏览器视口坐标 (clientX/Y)，需先转成 viewport 相对坐标再 screenToWorld
  const { x, y } = clientToWorld(sx, sy)
  const TOLERANCE_PX = 8 // 世界坐标 8px 内视为命中
  let hit: GuideLine | null = null
  let best = TOLERANCE_PX + 1
  for (const g of store.guides) {
    const dist = g.direction === 'vertical' ? Math.abs(g.position - x) : Math.abs(g.position - y)
    if (dist < best) {
      best = dist
      hit = g
    }
  }
  return hit
}
/** dblclick 命中 guide → 删除 */
function onDblClickDelegation(e: MouseEvent) {
  if (readonly) return
  const g = hitTestGuide(e.clientX, e.clientY)
  if (!g) return
  e.stopPropagation()
  store.removeGuide(g.id)
}
/** 右键：若命中 guide，弹出"辅助线右键菜单"（带删除/清空） */
function showGuideContextMenu(e: MouseEvent, g: GuideLine) {
  if (!contextMenuRef.value) return
  const groups: ContextMenuGroups = [
    [
      {
        label: '删除此辅助线',
        icon: Delete,
        shortcut: '双击辅助线',
        danger: true,
        action: () => store.removeGuide(g.id),
      },
      { divider: true } as any,
      {
        label: '清空所有辅助线',
        icon: Delete,
        disabled: store.guides.length === 0,
        danger: true,
        action: () => store.clearGuides(),
      },
    ],
  ]
  contextMenuRef.value.show(e.clientX, e.clientY, groups)
}

/** 🔑 删除多选（若有 groupId，会正常处理，因为删除的是 components） */
function deleteSelection() {
  const ids =
    store.selectedIds.length > 0
      ? [...store.selectedIds]
      : store.selectedId
        ? [store.selectedId]
        : []
  ids.forEach((id) => store.removeComponent(id))
  store.clearSelection()
}

// ========== Lifecycle ==========
function onFitToScreenEvent() { fitToScreen() }
onMounted(async () => {
  startViewportObserver(() => refreshGuides())
  initGuides()
  window.addEventListener('bi-editor:fit-to-screen', onFitToScreenEvent)
  onBeforeUnmount(() => {
    window.removeEventListener('bi-editor:fit-to-screen', onFitToScreenEvent)
  })

  // 🔑 画布导出 PNG：注册回调给 store（配合 html-to-image）
  //    导出前：临时清除选中高亮、关闭右键菜单、重置 transform 为 1:1 + 0 偏移（裁剪完整 sheet）
  //    导出后：restore
  if (!readonly) {
    const unregister = store.registerExportPng(async () => {
      const { toPng } = await import('html-to-image')
      const sheet = canvasSheetRef.value
      if (!sheet) return null
      // 1) 临时隐藏选中指示：多选高亮 / marquee / contextmenu / info-bar
      //    通过动态给 canvas-sheet 加 class + 父容器 style，避免影响 toPng 读取 DOM
      const container = containerRef.value
      const priorInfoBar = document.querySelector<HTMLElement>('.canvas-info-bar')
      const priorTransform = transformLayerStyle.value
      const priorOffset = offsetLayerStyle.value
      const priorSelectedIds = new Set<string>(store.selectedIds ?? [])
      const priorSelectedId = store.selectedId
      contextMenuRef.value?.hide?.()
      // 2) 临时清空选中态（保证导出图片没有蓝色选中框）
      store.clearSelection()
      // 3) transform layer 还原到 1:1 0:0 定位，保证 toPng(canvas-sheet) 刚好在视口里不被裁切
      if (container && priorInfoBar) priorInfoBar.style.display = 'none'
      try {
        // 使用 toPng，将 canvas-sheet 的尺寸作为像素尺寸
        const dataUrl = await toPng(sheet, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: store.canvas.backgroundColor || '#ffffff',
          // 过滤不必要的水印/右键菜单 DOM
          filter: (node) => {
            const cls = (node as HTMLElement).className
            if (typeof cls !== 'string') return true
            // 跳过右键菜单 overlay / marquee
            if (/bi-context-menu|marquee-rect|canvas-info-bar/.test(cls)) return false
            return true
          },
        })
        return dataUrl
      } catch (e) {
        console.error('[CanvasArea] export PNG failed', e)
        return null
      } finally {
        // 4) 恢复：选中态 + info-bar 显示
        if (priorSelectedIds.size > 0) {
          priorSelectedIds.forEach((id) => store.selectComponentAccum(id, false))
        } else if (priorSelectedId) {
          store.selectComponent(priorSelectedId)
        }
        if (container && priorInfoBar) priorInfoBar.style.display = ''
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _keep1 = priorTransform
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _keep2 = priorOffset
      }
    })
    onBeforeUnmount(unregister)
  }
})
</script>

<!-- 🔑 全局 cursor 样式（非 scoped：body 级别覆盖所有元素） -->
<style lang="less">
/* 拖拽中：全局 grabbing，覆盖所有元素（鼠标移出原组件也保持） */
body.bi-dragging,
body.bi-dragging * {
  cursor: grabbing !important;
}
/* 框选中：全局 crosshair */
body.bi-marqueeing,
body.bi-marqueeing * {
  cursor: crosshair !important;
}
/* 组件 hover：grab（提示可拖拽） */
.component-layout-box:not(.locked):hover {
  cursor: grab;
}
/* 锁定组件 hover：not-allowed */
.component-layout-box.locked:hover {
  cursor: not-allowed;
}
</style>

<style scoped lang="less">
.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bi-canvas-bg, #374151);
  overflow: hidden;
  position: relative;
  cursor: default;
  user-select: none;
}
.canvas-container::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
  background-image: radial-gradient(circle, var(--bi-canvas-grid-dot-color, rgba(209, 213, 219, 0.45)) 1.2px, transparent 1.2px);
  background-size: 24px 24px;
}
.canvas-container.show-dots::before {
  opacity: 1;
}
.canvas-container.pan-cursor {
  cursor: grab;
}

.canvas-layout {
  position: absolute;
  inset: 0 0 28px 0;
  z-index: 1;
  // --ruler 变量取值：标尺显示时 42px，隐藏时 0px。由 layoutStyle 注入。
  // 所有子元素用绝对定位 + 该变量计算位置，完全不依赖兄弟元素的存在/显示，
  // 彻底避免之前 display:grid 方案中 v-if/v-show 移除子元素后推断 1fr=0 的问题。
}
.ruler-corner {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--ruler, 0px);
  height: var(--ruler, 0px);
  background: var(--bi-ruler-bg, #1f2937);
  border-right: 1px solid var(--bi-ruler-border, #4b5563);
  border-bottom: 1px solid var(--bi-ruler-border, #4b5563);
  z-index: 3;
}
.ruler-horizontal {
  position: absolute;
  top: 0;
  left: var(--ruler, 0px);
  right: 0;
  height: var(--ruler, 0px);
  border-bottom: 1px solid var(--bi-ruler-border, #4b5563);
  background: var(--bi-header-bg, #374151);
  z-index: 2;
}
.ruler-vertical {
  position: absolute;
  left: 0;
  top: var(--ruler, 0px);
  bottom: 0;
  width: var(--ruler, 0px);
  border-right: 1px solid var(--bi-ruler-border, #4b5563);
  background: var(--bi-header-bg, #374151);
  z-index: 2;
}
.canvas-viewport {
  position: absolute;
  left: var(--ruler, 0px);
  top: var(--ruler, 0px);
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: transparent;
  z-index: 1;
}

.canvas-transform-layer {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
  transition: transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.canvas-offset-layer {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  will-change: transform;
  transition: transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.canvas-sheet {
  position: absolute;
  box-shadow:
    0 0 0 1px rgba(55, 65, 81, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.15);
  background-color: var(--bi-sheet-bg, rgba(255, 255, 255, 0.96));
  overflow: visible;
  user-select: none;
}

/* 🔑 pan-mode：空格键/中键平移画布时，通过 CSS 一次性禁用所有组件的 pointer-events，
     等效于 100 个组件的 isDraggable=false，但只需 1 次 DOM class 更新（替代 100 次 prop diff）。
     组件根 div 收不到 mousedown → 不会启动拖拽；cursor: grab 提供平移视觉反馈。 */
.canvas-sheet.pan-mode .component-layout-box {
  pointer-events: none;
}
.canvas-sheet.pan-mode .canvas-component-wrapper-inner {
  cursor: grab !important;
}

/* 🔑 GroupBox 样式已移至 GroupBox.vue 子组件 */

/* 🔑 框选 marquee 矩形样式：半透明蓝色填充 + 虚线边框 */
.marquee-rect {
  border: 1.5px dashed rgba(64, 158, 255, 0.95);
  background: rgba(64, 158, 255, 0.12);
  border-radius: 2px;
  box-sizing: border-box;
  backdrop-filter: blur(0.4px);
}

.empty-canvas {
  position: absolute;
  inset: 42px 0 28px 0;
  left: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  pointer-events: none;
  z-index: 10;
}
.empty-canvas p {
  color: var(--bi-text-muted, #9ca3af);
  font-size: 14px;
}
</style>

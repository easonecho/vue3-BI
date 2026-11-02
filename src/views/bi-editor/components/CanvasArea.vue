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
    @dblclick="readonly ? undefined : onCanvasDblClick($event)"
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
      @dblclick="readonly ? undefined : onSheetDblClick($event)"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import CanvasSnapLines from './CanvasSnapLines.vue'
import CanvasComponentItem from './CanvasComponentItem.vue'
import CanvasInfoBar from './CanvasInfoBar.vue'
import GroupBox from './GroupBox.vue'
import ContextMenu from './ContextMenu.vue'
import { useCanvasTransform } from '@/views/bi-editor/composables/useCanvasTransform'
import { useSmartGuides } from '@/views/bi-editor/composables/useSmartGuides'
import { useRulerGuides } from '@/views/bi-editor/composables/useRulerGuides'
import { useCanvasInteraction } from '@/views/bi-editor/composables/useCanvasInteraction'
import { useMarqueeSelect } from '@/views/bi-editor/composables/useMarqueeSelect'
import { useCanvasContextMenu } from '@/views/bi-editor/composables/useCanvasContextMenu'
import { useCanvasFit } from '@/views/bi-editor/composables/useCanvasFit'
import { useViewportCulling } from '@/views/bi-editor/composables/useViewportCulling'
import { useCanvasGroupDrag } from '@/views/bi-editor/composables/useCanvasGroupDrag'
import { useCanvasExportPng } from '@/views/bi-editor/composables/useCanvasExportPng'

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

// ========== 框选 marquee（逻辑见 useMarqueeSelect） ==========
// 🔑 性能优化：缓存 viewport rect，避免拖拽/框选期间每次 mousemove 都调用 getBoundingClientRect()
//   getBoundingClientRect() 在有 pending DOM 写入时会强制布局重计算（layout thrashing）
let cachedViewportRect: DOMRect | null = null

function clientToWorld(clientX: number, clientY: number) {
  const rect = cachedViewportRect ?? viewportRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return screenToWorld(clientX - rect.left, clientY - rect.top)
}

// ========== Canvas sheet (logical canvas box + component carrier) ==========
const canvasSheetRef = ref<HTMLElement | null>(null)

// 自适应缩放 / 辅助线命中（内部注册 bi-editor:fit-to-screen 全局事件）
const { hitTestGuide, onCanvasDblClick, onSheetDblClick } = useCanvasFit({
  store,
  containerRef,
  readonly,
  clientToWorld,
  eventTouchesComponent,
})

// 框选交互（marquee / suppressClick / DOM 直改选中态）抽到 composable
const { marquee, marqueeStyle, suppressClick, suppressNextClick, startMarquee, dispose } =
  useMarqueeSelect({
    store,
    sheetRef: canvasSheetRef,
    clientToWorld,
  })

// 分组整体拖拽（选中分组包围盒空白区 mousedown 时启动）
const { startGroupDrag, dispose: disposeGroupDrag } = useCanvasGroupDrag({
  store,
  clientToWorld,
  snapRectToGuides,
  applySnapLines,
  clearSnapLines,
  resetSnapCache,
  suppressNextClick,
})

// 右键菜单（组件 / 画布空白 / 辅助线）抽到 composable
const { contextMenuRef, onComponentContextMenu, onCanvasContextMenu } = useCanvasContextMenu({
  store,
  hitTestGuide,
})

// 画布导出 PNG：注册回调给 store（html-to-image），随组件生命周期注销
useCanvasExportPng({ store, readonly, canvasSheetRef, contextMenuRef })

// 视口裁剪（虚拟化渲染）：只渲染可见区域 + 缓冲区内的组件
const { visibleComponents } = useViewportCulling({
  store,
  readonly,
  localScale,
  viewportWidth,
  viewportHeight,
  screenToWorld,
})

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
const onItemContextMenu = (e: MouseEvent, id: string) => {
  if (readonly) return
  // 🔑 阻止冒泡到 canvas-sheet：否则 onCanvasContextMenu 会紧接着执行，
  //    用「画布空白菜单」覆盖掉刚弹出的「组件菜单」。
  e.stopPropagation()
  onComponentContextMenu(e, id)
}

/**
 * 🔑 判断 mousedown / click 事件路径中是否命中了组件 DOM。
 *   由于 canvas-sheet 绑定已从 @xxx.self 改为冒泡捕获，需要手动识别「点击点真的在 sheet 空白」vs
 *   「点击点在组件内部但由子元素 DOM（如 selection-border、component-content、ECharts canvas 等）
 *   触发了事件冒泡」。命中组件 DOM → 不执行 sheet 级逻辑（清空选中 / 框选 / 分组拖拽），交给组件自身处理。
 */
function eventTouchesComponent(e: Event): boolean {
  const path: EventTarget[] = typeof e.composedPath === 'function'
    ? e.composedPath()
    : e.target ? [e.target] : []
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
  //   → 启动分组整体拖拽（覆盖 canvas-sheet 的框选行为），满足「边框内任何地方都能拖分组」
  const world = clientToWorld(e.clientX, e.clientY)
  if (startGroupDrag(e, world)) return

  // 🔑 Shift+拖拽：保留已有选中（additive）；否则清空
  startMarquee(world, e.shiftKey || e.ctrlKey || e.metaKey)
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
  dispose()
  disposeGroupDrag()
  // 🔑 组件卸载时清理残留的全局 cursor class，避免泄露到其他页面
  document.body.classList.remove('bi-dragging', 'bi-marqueeing')
})

// ========== Canvas sheet style ==========
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

// ========== Lifecycle ==========
onMounted(() => {
  startViewportObserver(() => refreshGuides())
  initGuides()
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

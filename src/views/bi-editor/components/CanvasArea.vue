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
              <CanvasSnapLines
                v-if="!readonly"
                :vertical="snapLines.vertical"
                :horizontal="snapLines.horizontal"
              />

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
              <div v-if="!readonly && marquee.visible" class="marquee-rect" :style="marqueeStyle" />

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
                       ComponentRenderer → Widget 的 props.comp 仍是旧引用。
                     - 加入这 4 个引用后，浅比较 Object.is 会正确检测到引用变更。 */
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
import { useCanvasCoordinates } from '@/views/bi-editor/composables/useCanvasCoordinates'
import {
  eventTouchesComponent,
  useCanvasPointerDelegation,
} from '@/views/bi-editor/composables/useCanvasPointerDelegation'

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
 */
function handleSelect(event: MouseEvent | undefined, id: string) {
  if (!event || !(event instanceof MouseEvent)) {
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

// ========== 坐标换算（缓存 viewport rect，避免拖拽期间反复强制布局） ==========
const { clientToWorld, refreshViewportRect } = useCanvasCoordinates({
  viewportRef,
  screenToWorld,
})

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

// ========== 空白区事件委托（选中清空 / 分组拖拽 / 框选） ==========
const { handleEmptyAreaDelegation, handleSheetMouseDownDelegation, handleEmptyAreaClick } =
  useCanvasPointerDelegation({
    store,
    isSpacePressed,
    clientToWorld,
    refreshViewportRect,
    startGroupDrag,
    startMarquee,
    getSuppressClick: () => suppressClick.value,
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
const onItemSelect = (ev: MouseEvent, id: string) => {
  if (!readonly) handleSelect(ev, id)
}
const onItemWrapperMouseDown = (e: MouseEvent, id: string) => {
  if (!readonly) handleWrapperMouseDown(e, id)
}
const onItemResizeStart = (e: MouseEvent, id: string, pos: string) => {
  if (!readonly) handleResizeStart(e, id, pos)
}
const onItemContextMenu = (e: MouseEvent, id: string) => {
  if (readonly) return
  // 🔑 阻止冒泡到 canvas-sheet：否则 onCanvasContextMenu 会用空白菜单覆盖组件菜单
  e.stopPropagation()
  onComponentContextMenu(e, id)
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
@import './canvas-area-global.less';
</style>

<style scoped lang="less">
@import './canvas-area.less';
</style>

<template>
  <div
    class="component-layout-box"
    :class="{ locked: comp.locked, invisible: !comp.visible }"
    :data-comp-id="comp.id"
    :style="wrapperStyle"
    @click="onSelect"
    @mousedown.capture="onWrapperMouseDownCapture"
    @contextmenu.prevent="onComponentContextmenu"
  >
    <div
      v-if="isVisuallySelected && !belongsToSelectedGroup"
      class="selection-border"
      :class="{ primary: comp.id === selectedId }"
    >
      <div v-if="comp.id === selectedId">
        <div
          v-for="handle in resizeHandles"
          :key="handle.position"
          class="resize-handle"
          :class="handle.position"
          @mousedown.stop="emit('resize-start', $event, comp.id, handle.position)"
        />
      </div>
    </div>

    <div
      class="canvas-component-wrapper-inner"
      :class="{ selected: isVisuallySelected, locked: comp.locked, 'has-dz': hasActiveDataZoom }"
      :style="cardStyle"
    >
      <div class="component-content">
        <ComponentRenderer :component="comp" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ComponentRenderer from './ComponentRenderer.vue'
import type { ResizeHandle } from '@/views/bi-editor/composables/useCanvasInteraction'
import { useBiEditorStore } from '@/stores/bi-editor'

interface BiComponent {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  visible: boolean
  locked: boolean
  type: string
  groupId?: string
  fixedGroupBox?: { x: number; y: number; width: number; height: number }
  props: Record<string, any>
  style: Record<string, any>
  dataSource: { datasetId: number | null }
  dataConfig: Record<string, unknown>
}

interface GroupDragPreview {
  groupId: string
  dx: number
  dy: number
  draggedId: string
}

interface Props {
  comp: BiComponent
  /** 主选中（最后点击的组件） */
  selectedId: string | null
  /** 多选集合（Shift+Click / 框选产生），为 true 时显示选中边框但不显示拉伸手柄 */
  multiSelected: boolean
  resizeHandles: ResizeHandle[]
  /** 🔑 是否属于「被选中的分组」——是则隐藏个人选中边框，改由 GroupBox 统一显示组级边框 */
  belongsToSelectedGroup: boolean
}
const props = defineProps<Props>()

/**
 * 🔑 性能优化：直接读 store 而不通过 prop 接收 groupDragPreview。
 *   原因：若通过 prop 传递，父组件 v-for 模板会订阅 store.groupDragPreview（高频变化），
 *   每帧 setDragPreview 都触发整个 v-for 重渲染 + 100 次 v-memo 数组比较。
 *   改为子组件内部读 store：响应式订阅范围收敛到子组件 computed，
 *   父组件 v-for 只依赖低频的 activeDragId/activeDragGroupId（v-memo 控制）。
 *
 *   拖拽期间 store.groupDragPreview 变化（每帧）：
 *   - 父 v-for 不重渲染（v-memo 数组不读 groupDragPreview）
 *   - 仅 v-memo 失效的组件（主体+同组）re-patch，读取本 computed → 重新评估 → 应用新 transform
 *   - 其他组件不 re-patch → computed 虽标记 dirty 但不被读取 → 不评估（lazy computed）
 */
const store = useBiEditorStore()

/**
 * 🔑 当前组件的拖拽预览偏移：
 *   - 先用低频的 activeDragId/activeDragGroupId 早退（不读高频的 groupDragPreview）
 *   - 仅当确认是主体或同组组员时，才读 groupDragPreview 取 dx/dy
 */
const groupDragOffset = computed<GroupDragPreview | null>(() => {
  const dragId = store.activeDragId
  const dragGroupId = store.activeDragGroupId
  // 早退 1：不是主体
  if (dragId !== props.comp.id) {
    // 早退 2：不同组（或本组件无组）
    if (!props.comp.groupId || dragGroupId !== props.comp.groupId) return null
  }
  // 确认是主体或同组组员，才读高频变化的 groupDragPreview
  const p = store.groupDragPreview
  if (!p) return null
  if (p.draggedId === props.comp.id) return p
  if (props.comp.groupId && p.groupId === props.comp.groupId) return p
  return null
})

/** 🔑 组件卡片外观样式：读取 RightPanel「样式」栏的 comp.style（backgroundColor / borderRadius / border）。
 *   注意：各 Widget 内部可能自己再叠一层样式（如 ECharts 内部背景、rect 自身填充），
 *   这里是最外层卡片样式，与 Widget 内部样式形成层级关系。 */
const cardStyle = computed(() => {
  const s = props.comp.style || {}
  return {
    backgroundColor: s.backgroundColor || undefined,
    borderRadius: typeof s.borderRadius === 'number' ? `${s.borderRadius}px` : undefined,
    borderColor: s.borderColor || undefined,
    borderWidth: typeof s.borderWidth === 'number' ? `${s.borderWidth}px` : undefined,
    borderStyle: s.borderStyle || (s.borderWidth ? 'solid' : undefined),
  }
})

/** 🔑 纯 div 定位：直接用 left/top/width/height 渲染组件盒子。
 *   拖拽期间通过 CSS transform 叠加预览位移（与 groupDragOffset 联动），
 *   实现零响应式触发、零模板 re-render 的视觉跟随。
 *   willChange 仅在拖拽期间声明，避免常驻 GPU 层。
 */
const wrapperStyle = computed(() => {
  const offset = groupDragOffset.value
  return {
    position: 'absolute' as const,
    left: `${props.comp.x}px`,
    top: `${props.comp.y}px`,
    width: `${props.comp.width}px`,
    height: `${props.comp.height}px`,
    zIndex: props.comp.zIndex,
    opacity: props.comp.visible ? undefined : 0,
    pointerEvents: props.comp.visible ? undefined : ('none' as const),
    transform: offset ? `translate(${offset.dx}px, ${offset.dy}px)` : undefined,
    willChange: offset ? ('transform' as const) : undefined,
  }
})

/** 🔑 视觉选中 = 主选中（含单选）或多选集合中的一员 */
const isVisuallySelected = computed(() => props.comp.id === props.selectedId || props.multiSelected)

/** 🔑 当前组件是否开启了 ECharts dataZoom（inside/slider 均算），用于滚轮隔离判断 */
const hasActiveDataZoom = computed(() => {
  return Boolean(props.comp.props?.dataZoomShow)
})

const emit = defineEmits<{
  (e: 'select', event: MouseEvent, id: string): void
  (e: 'wrapper-mousedown', event: MouseEvent, id: string): void
  (e: 'resize-start', event: MouseEvent, id: string, handlePosition: string): void
  /** 🔑 组件右键菜单：event 为原始 MouseEvent（已被 prevent，不弹系统菜单） */
  (e: 'component-contextmenu', event: MouseEvent, id: string): void
}>()

// 🔑 性能优化：稳定事件处理器。
//   内联箭头函数每次渲染创建新引用 → Vue 事件绑定比较开销 + 子组件不必要的更新检查。
//   提取为稳定函数，引用不变，零 diff 开销。
const onSelect = (e: MouseEvent) => emit('select', e, props.comp.id)

/** 🔑 识别组件内部「有自己特定拖拽交互的微小区块」。
 *   与上一轮修复的核心区别：
 *   ❌ 不再把整个 .base-chart 当成禁拖区（那会导致整个图表完全拖不动，用户没法布局）。
 *   ✅ 只精确排除「有明确独立拖拽语义的 ECharts DOM 元素」（例如 dataZoom slider 手柄/条）。
 *     对于其他 canvas 区域、inside 型平移等：交给「高阈值启动」策略处理
 *     （useCanvasInteraction 中会根据标记位使用 12px 高阈值代替 2px 低阈值，
 *      小范围移动由 ECharts 接管，大范围移动才认为是要拖走整个组件）。
 */
function isEChartsZoomWidget(target: EventTarget | null): boolean {
  if (!target) return false
  const el = target as HTMLElement
  if (!el || typeof el.closest !== 'function') return false
  // ECharts 为 dataZoom 渲染的 DOM / SVG 元素 class 包含关键词（不同版本：data-zoom / datazoom / echarts-data-zoom）
  if (el.closest('[class*="data-zoom"], [class*="datazoom"], [class*="DataZoom"]')) return true
  return false
}

/** 🔑 标记「这个 mousedown 是否发生在 .base-chart / .el-table 这类有内部交互的容器内」。
 *   不在 capture 阶段直接拦截，而是给事件打标记，让 useCanvasInteraction 用高阈值策略。
 *   这样用户小范围操作（inside 数据平移、table 滚动条微拖、slider 拖动）由内部组件接管，
 *   大范围拖动（>12px）仍然能拖走整个组件，兼顾专业度与可用性。
 */
function isInsideInteractiveContainer(target: EventTarget | null): boolean {
  if (!target) return false
  const el = target as HTMLElement
  if (!el || typeof el.closest !== 'function') return false
  if (el.closest('.base-chart')) return true
  if (el.closest('.component-content .el-table')) return true
  return false
}

const onWrapperMouseDownCapture = (e: MouseEvent) => {
  // 1) 精确排除：dataZoom slider 手柄/条这类独立拖拽元素，完全不启动组件拖拽
  if (isEChartsZoomWidget(e.target)) return
  // 2) 打标记：其他内部交互区，走 useCanvasInteraction 的高阈值启动（12px vs 2px）
  ;(e as any).__biInternalInteractive = isInsideInteractiveContainer(e.target)
  emit('wrapper-mousedown', e, props.comp.id)
}

const onComponentContextmenu = (e: MouseEvent) => emit('component-contextmenu', e, props.comp.id)
</script>

<style scoped lang="less">
.canvas-component-wrapper-inner {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: move;
  box-sizing: border-box;
  user-select: none;
  pointer-events: auto;
}
.canvas-component-wrapper-inner.locked {
  cursor: not-allowed;
}
.component-layout-box.locked {
  cursor: not-allowed !important;
}
.component-layout-box.locked::after {
  /* 🔒 锁定组件右上角小角标，直观可识别 */
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 14px 14px 0;
  border-color: transparent #f59e0b transparent transparent;
  pointer-events: none;
  z-index: 2;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
}
.canvas-component-wrapper-inner.selected {
  z-index: 9999;
}
.selection-border {
  position: absolute;
  inset: -1px;
  border: 2px dashed rgba(64, 158, 255, 0.8);
  pointer-events: none;
  z-index: 10000;
}
/* 🔑 主选中（最后点击的组件）：实线，强度更高，带拉伸手柄 */
.selection-border.primary {
  border-style: solid;
  border-color: var(--bi-accent, #409eff);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--bi-accent, #409eff);
  border: 1px solid #fff;
  z-index: 10;
  pointer-events: auto;
}
.resize-handle.nw-cursor {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}
.resize-handle.n-cursor {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}
.resize-handle.ne-cursor {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}
.resize-handle.e-cursor {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  cursor: e-resize;
}
.resize-handle.se-cursor {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}
.resize-handle.s-cursor {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}
.resize-handle.sw-cursor {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}
.resize-handle.w-cursor {
  top: 50%;
  left: -4px;
  cursor: w-resize;
}
.component-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
/*
 * 🔑 DOM 直改临时选中态（框选期间用，绕开 Vue 响应式）：
 *   - marquee-dom-multi：框选命中，蓝色虚线（视觉与 .selection-border multi 一致）
 *   - marquee-dom-primary：主选中，实线+阴影（视觉与 .selection-border.primary 一致）
 *   与内部的 .selection-border（Vue 响应式控制）并存时，视觉相同即可，
 *   框选结束会清理这些临时 class，由 Vue 响应式接管。
 * ⚠️ 用 ::before 不与 locked::after（右上角锁定角标）冲突。
 */
.component-layout-box.marquee-dom-multi::before,
.component-layout-box.marquee-dom-primary::before {
  content: '';
  position: absolute;
  inset: -1px;
  border: 2px dashed rgba(64, 158, 255, 0.8);
  pointer-events: none;
  z-index: 10000;
  box-sizing: border-box;
}
.component-layout-box.marquee-dom-primary::before {
  border-style: solid;
  border-color: var(--bi-accent, #409eff);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}
</style>

<template>
  <div
    ref="containerRef"
    class="canvas-container"
    :class="{
      'pan-cursor': !readonly && (isSpacePressed || isMiddlePressed || isPanning),
      'show-dots': !readonly && store.canvas.showGrid,
      'readonly-mode': readonly,
    }"
    @wheel.capture="readonly ? undefined : handleWheel"
    @mousedown="readonly ? undefined : handleContainerMouseDown"
  >
    <div class="canvas-layout" :style="layoutStyle">
      <div v-if="!readonly && store.canvas.showRuler" class="ruler-corner" />
      <div v-if="!readonly && store.canvas.showRuler" ref="hGuidesRef" class="ruler-horizontal" />
      <div v-if="!readonly && store.canvas.showRuler" ref="vGuidesRef" class="ruler-vertical" />

      <div
        ref="viewportRef"
        class="canvas-viewport"
        :style="viewportStyle"
        @click.self="readonly ? undefined : store.selectComponent(null)"
        @drop="readonly ? undefined : handleDrop"
        @dragover.prevent
      >
        <div
          class="canvas-transform-layer"
          :style="transformLayerStyle"
          @click.self="readonly ? undefined : store.selectComponent(null)"
        >
          <div
            class="canvas-offset-layer"
            :style="offsetLayerStyle"
            @click.self="readonly ? undefined : store.selectComponent(null)"
          >
            <div
              ref="canvasSheetRef"
              class="canvas-sheet"
              :style="canvasSheetStyle"
              @click.self="readonly ? undefined : store.selectComponent(null)"
            >
              <CanvasSnapLines v-if="!readonly" :vertical="snapLines.vertical" :horizontal="snapLines.horizontal" />

              <CanvasComponentItem
                v-for="comp in store.components"
                :key="comp.id + '_' + store.refreshKey"
                :comp="comp"
                :selected-id="readonly ? null : store.selectedId"
                :resize-handles="readonly ? [] : resizeHandles"
                :is-space-pressed="readonly ? false : isSpacePressed"
                :is-panning="readonly ? false : isPanning"
                @select="readonly ? undefined : handleSelect"
                @wrapper-mousedown="readonly ? undefined : handleWrapperMouseDown"
                @resize-start="readonly ? undefined : handleResizeStart"
                @vdr-dragging="readonly ? undefined : handleVdrDragging"
                @vdr-dragstop="readonly ? undefined : handleVdrDragstop"
                @vdr-activated="readonly ? undefined : handleSelect"
                @vdr-clicked="readonly ? undefined : handleSelect"
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

    <div v-if="!readonly" class="canvas-info-bar">
      <span>画布: {{ store.canvas.width }} × {{ store.canvas.height }}</span>
      <el-divider direction="vertical" />
      <span>缩放: {{ Math.round(localScale * 100) }}%</span>
      <el-divider direction="vertical" />
      <span>
        选中:
        <template v-if="store.selectedComponent">
          {{ store.selectedComponent.name }} ({{ Math.round(store.selectedComponent.x) }},
          {{ Math.round(store.selectedComponent.y) }})
          {{ Math.round(store.selectedComponent.width) }}×{{
            Math.round(store.selectedComponent.height)
          }}
        </template>
        <template v-else>未选择</template>
      </span>
      <el-divider direction="vertical" />
      <span>组件数: {{ store.components.length }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import CanvasSnapLines from './CanvasSnapLines.vue'
import CanvasComponentItem from './CanvasComponentItem.vue'
import { useCanvasTransform } from '@/views/bi-editor/composables/useCanvasTransform'
import { useSmartGuides } from '@/views/bi-editor/composables/useSmartGuides'
import { useRulerGuides } from '@/views/bi-editor/composables/useRulerGuides'
import { useCanvasInteraction } from '@/views/bi-editor/composables/useCanvasInteraction'

const props = withDefaults(defineProps<{ readonly?: boolean }>(), { readonly: false })

const emit = defineEmits<{
  (e: 'select-component', id: string | null): void
}>()

const store = useBiEditorStore()
// readonly prop 在模板中直接访问,无需 script 内解构
void props

// ========== Smart Guides ==========
const { snapLines, clearSnapLines, applySnapLines, snapRectToGuides } = useSmartGuides()

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
  handleSelect,
  handleWrapperMouseDown,
  handleVdrDragging,
  handleVdrDragstop,
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
  onSelectComponent: (id) => emit('select-component', id),
})

// Wire Escape → resize abort (after both composables constructed, before mount)
escapeHook = () => abortActiveResize()

// ========== Canvas sheet (logical canvas box + component carrier) ==========
const canvasSheetRef = ref<HTMLElement | null>(null)
const canvasSheetStyle = computed(() => ({
  left: '0px',
  top: '0px',
  width: `${store.canvas.width}px`,
  height: `${store.canvas.height}px`,
  backgroundColor: store.canvas.backgroundColor,
}))

// ========== Lifecycle ==========
onMounted(async () => {
  startViewportObserver(() => refreshGuides())
  initGuides()
})
</script>

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
  background-image: radial-gradient(circle, rgba(209, 213, 219, 0.45) 1.2px, transparent 1.2px);
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
  background: #1f2937;
  border-right: 1px solid #4b5563;
  border-bottom: 1px solid #4b5563;
  z-index: 3;
}
.ruler-horizontal {
  position: absolute;
  top: 0;
  left: var(--ruler, 0px);
  right: 0;
  height: var(--ruler, 0px);
  border-bottom: 1px solid #4b5563;
  background: #374151;
  z-index: 2;
}
.ruler-vertical {
  position: absolute;
  left: 0;
  top: var(--ruler, 0px);
  bottom: 0;
  width: var(--ruler, 0px);
  border-right: 1px solid #4b5563;
  background: #374151;
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
}
.canvas-offset-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
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
.canvas-info-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: var(--bi-info-bar-bg, #111827);
  border-top: 1px solid var(--bi-border-color, #374151);
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
  z-index: 2;
}
</style>

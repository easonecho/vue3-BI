<template>
  <div ref="containerRef" class="canvas-container">
    <div ref="viewportRef" class="canvas-viewport" @wheel="handleWheel">
      <!-- 标尺 -->
      <div v-if="store.canvas.showRuler" class="ruler-container">
        <div class="ruler ruler-horizontal">
          <div
            v-for="mark in horizontalMarks"
            :key="mark"
            class="ruler-mark"
            :style="{ left: mark * zoom + 'px' }"
          >
            <span class="mark-label">{{ Math.round(mark) }}</span>
          </div>
        </div>
        <div class="ruler ruler-vertical">
          <div
            v-for="mark in verticalMarks"
            :key="mark"
            class="ruler-mark"
            :style="{ top: mark * zoom + 'px' }"
          >
            <span class="mark-label">{{ Math.round(mark) }}</span>
          </div>
        </div>
      </div>

      <!-- 画布内容 -->
      <div
        class="canvas-content"
        :style="{
          width: store.canvas.width * zoom + 'px',
          height: store.canvas.height * zoom + 'px',
          transform: 'scale(' + zoom + ')',
          transformOrigin: '0 0',
        }"
        @click.self="store.selectComponent(null)"
        @drop="handleDrop"
        @dragover.prevent
      >
        <!-- 网格背景 -->
        <div v-if="store.canvas.showGrid" class="grid-background"></div>

        <!-- 画布背景 -->
        <div class="canvas-bg" :style="{ backgroundColor: store.canvas.backgroundColor }"></div>

        <!-- 辅助线 -->
        <template v-if="store.canvas.showGuides">
          <div
            v-for="guide in horizontalGuides"
            :key="guide.id"
            class="guide-line guide-horizontal"
            :style="{ top: guide.position + 'px' }"
          ></div>
          <div
            v-for="guide in verticalGuides"
            :key="guide.id"
            class="guide-line guide-vertical"
            :style="{ left: guide.position + 'px' }"
          ></div>
        </template>

        <!-- 画布组件 -->
        <template v-for="comp in visibleComponents" :key="comp.id">
          <div
            v-show="comp.visible"
            class="canvas-component"
            :class="{ selected: comp.id === store.selectedId, locked: comp.locked }"
            :style="{
              left: comp.x + 'px',
              top: comp.y + 'px',
              width: comp.width + 'px',
              height: comp.height + 'px',
              zIndex: comp.zIndex,
            }"
            @click.stop="handleSelect(comp.id)"
          >
            <div v-if="comp.id === store.selectedId" class="selection-border">
              <div
                v-for="handle in resizeHandles"
                :key="handle.position"
                class="resize-handle"
                :class="handle.position"
                @mousedown.stop="handleResizeStart($event, comp.id, handle.position)"
              ></div>
            </div>
            <div class="component-content">
              <component-renderer :component="comp" />
            </div>
          </div>
        </template>
      </div>

      <div v-if="store.components.length === 0" class="empty-canvas">
        <el-icon :size="64" color="#9ca3af"><Plus /></el-icon>
        <p>拖拽组件到画布，或点击左侧组件库添加</p>
      </div>
    </div>

    <!-- 信息栏 -->
    <div class="canvas-info-bar">
      <span>画布: {{ store.canvas.width }} × {{ store.canvas.height }}</span>
      <el-divider direction="vertical" />
      <span>缩放: {{ Math.round(zoom * 100) }}%</span>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBiEditorStore } from '@/stores/biEditor'
import ComponentRenderer from './ComponentRenderer.vue'

const props = defineProps<{
  zoom: number
}>()

const emit = defineEmits<{
  (e: 'select-component', id: string | null): void
}>()

const store = useBiEditorStore()

const containerRef = ref<HTMLElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)

const zoom = computed(() => props.zoom || store.canvas.zoom)
const gridSize = computed(() => store.canvas.gridSize)

const horizontalMarks = computed(() => {
  const marks: number[] = []
  const step = 50
  const width = store.canvas.width
  for (let i = 0; i <= width; i += step) {
    marks.push(i)
  }
  return marks
})

const verticalMarks = computed(() => {
  const marks: number[] = []
  const step = 50
  const height = store.canvas.height
  for (let i = 0; i <= height; i += step) {
    marks.push(i)
  }
  return marks
})

const horizontalGuides = computed(() => store.guides.filter((g) => g.direction === 'horizontal'))

const verticalGuides = computed(() => store.guides.filter((g) => g.direction === 'vertical'))

const resizeHandles = [
  { position: 'nw-cursor' },
  { position: 'n-cursor' },
  { position: 'ne-cursor' },
  { position: 'e-cursor' },
  { position: 'se-cursor' },
  { position: 's-cursor' },
  { position: 'sw-cursor' },
  { position: 'w-cursor' },
]

const visibleComponents = computed(() => {
  if (!viewportRef.value) return store.components
  const viewportRect = viewportRef.value.getBoundingClientRect()
  const scrollLeft = viewportRef.value.scrollLeft
  const scrollTop = viewportRef.value.scrollTop
  const viewWidth = viewportRect.width / zoom.value
  const viewHeight = viewportRect.height / zoom.value
  return store.components.filter((comp) => {
    const compRight = comp.x + comp.width
    const compBottom = comp.y + comp.height
    return (
      compRight >= scrollLeft - 100 &&
      comp.x <= scrollLeft + viewWidth + 100 &&
      compBottom >= scrollTop - 100 &&
      comp.y <= scrollTop + viewHeight + 100
    )
  })
})

function handleWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    store.setZoom(zoom.value + delta)
  }
}

function handleSelect(id: string) {
  store.selectComponent(id)
  emit('select-component', id)
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const data = e.dataTransfer?.getData('application/json')
  if (data) {
    try {
      const meta = JSON.parse(data)
      const rect = viewportRef.value?.getBoundingClientRect()
      if (rect) {
        const x =
          (e.clientX - rect.left + viewportRef.value!.scrollLeft) / zoom.value -
          meta.defaultWidth / 2
        const y =
          (e.clientY - rect.top + viewportRef.value!.scrollTop) / zoom.value -
          meta.defaultHeight / 2
        store.addComponent(meta.type, x, y)
      }
    } catch {
      // ignore
    }
  }
}

function handleResizeStart(e: MouseEvent, id: string, handlePosition: string) {
  const comp = store.components.find((c) => c.id === id)
  if (!comp) return
  e.preventDefault()
  e.stopPropagation()

  const startX = e.clientX
  const startY = e.clientY
  const startComp = { ...comp }

  function handleMouseMove(ev: MouseEvent) {
    const deltaX = (ev.clientX - startX) / zoom.value
    const deltaY = (ev.clientY - startY) / zoom.value
    let newX = startComp.x
    let newY = startComp.y
    let newWidth = startComp.width
    let newHeight = startComp.height
    if (handlePosition.includes('e')) newWidth = Math.max(10, startComp.width + deltaX)
    if (handlePosition.includes('w')) {
      newWidth = Math.max(10, startComp.width - deltaX)
      newX = startComp.x + (startComp.width - newWidth)
    }
    if (handlePosition.includes('s')) newHeight = Math.max(10, startComp.height + deltaY)
    if (handlePosition.includes('n')) {
      newHeight = Math.max(10, startComp.height - deltaY)
      newY = startComp.y + (startComp.height - newHeight)
    }
    if (store.canvas.snapToGrid) {
      const gs = store.canvas.gridSize
      newX = Math.round(newX / gs) * gs
      newY = Math.round(newY / gs) * gs
      newWidth = Math.round(newWidth / gs) * gs
      newHeight = Math.round(newHeight / gs) * gs
    }
    store.updateComponent(id, { x: newX, y: newY, width: newWidth, height: newHeight })
  }

  function handleMouseUp() {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

onMounted(() => {
  // init
})

onBeforeUnmount(() => {
  // cleanup
})
</script>

<style scoped>
.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bi-canvas-bg, #374151);
  overflow: hidden;
  position: relative;
}
.canvas-viewport {
  flex: 1;
  overflow: auto;
  position: relative;
  scroll-behavior: auto;
}
.canvas-content {
  position: relative;
  transform-origin: 0 0;
  will-change: transform;
}
.grid-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
  background-size: 10px 10px;
}
.canvas-bg {
  position: absolute;
  inset: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}
.ruler-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}
.ruler {
  position: absolute;
  background: var(--bi-ruler-bg, #f9fafb);
}
.ruler-horizontal {
  top: 0;
  left: 20px;
  right: 0;
  height: 20px;
  border-bottom: 1px solid var(--bi-ruler-border, #d1d5db);
}
.ruler-vertical {
  top: 20px;
  left: 0;
  width: 20px;
  bottom: 0;
  border-right: 1px solid var(--bi-ruler-border, #d1d5db);
}
.ruler-mark {
  position: absolute;
  display: flex;
  align-items: flex-start;
}
.ruler-horizontal .ruler-mark {
  top: 0;
  width: 1px;
  height: 6px;
  background: var(--bi-ruler-tick, #9ca3af);
}
.ruler-horizontal .ruler-mark .mark-label {
  position: absolute;
  top: 8px;
  left: -15px;
  font-size: 10px;
  color: var(--bi-ruler-text, #6b7280);
  width: 30px;
  text-align: center;
}
.ruler-vertical .ruler-mark {
  left: 0;
  height: 1px;
  width: 6px;
  background: var(--bi-ruler-tick, #9ca3af);
}
.ruler-vertical .ruler-mark .mark-label {
  position: absolute;
  left: 8px;
  top: -8px;
  font-size: 10px;
  color: var(--bi-ruler-text, #6b7280);
  width: 30px;
  text-align: left;
  transform: rotate(-90deg);
  transform-origin: left center;
}
.guide-line {
  position: absolute;
  background: var(--bi-guide-color, #f59e0b);
  pointer-events: none;
  z-index: 50;
}
.guide-horizontal {
  left: 0;
  right: 0;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    var(--bi-guide-color, #f59e0b) 0,
    var(--bi-guide-color, #f59e0b) 5px,
    transparent 5px,
    transparent 10px
  );
}
.guide-vertical {
  top: 0;
  bottom: 0;
  width: 1px;
  background: repeating-linear-gradient(
    to bottom,
    var(--bi-guide-color, #f59e0b) 0,
    var(--bi-guide-color, #f59e0b) 5px,
    transparent 5px,
    transparent 10px
  );
}
.canvas-component {
  position: absolute;
  cursor: move;
  user-select: none;
}
.canvas-component.selected {
  z-index: 9999;
}
.canvas-component.locked {
  cursor: not-allowed;
}
.selection-border {
  position: absolute;
  inset: -1px;
  border: 2px solid var(--bi-accent, #409eff);
  pointer-events: none;
}
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--bi-accent, #409eff);
  border: 1px solid #fff;
  z-index: 10;
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
  transform: translateY(-50%);
  cursor: w-resize;
}
.component-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.empty-canvas {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  pointer-events: none;
}
.empty-canvas p {
  color: var(--bi-text-muted, #9ca3af);
  font-size: 14px;
}
.canvas-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px;
  background: var(--bi-info-bar-bg, #111827);
  border-top: 1px solid var(--bi-border-color, #374151);
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}
:deep(.canvas-viewport::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}
:deep(.canvas-viewport::-webkit-scrollbar-track) {
  background: var(--bi-scrollbar-track, #1f2937);
}
:deep(.canvas-viewport::-webkit-scrollbar-thumb) {
  background: var(--bi-scrollbar-thumb, #4b5563);
  border-radius: 5px;
}
:deep(.canvas-viewport::-webkit-scrollbar-thumb:hover) {
  background: var(--bi-scrollbar-thumb-hover, #6b7280);
}
</style>

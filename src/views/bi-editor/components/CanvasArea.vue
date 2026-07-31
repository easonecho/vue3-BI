<template>
  <div
    ref="containerRef"
    class="canvas-container"
    :class="{ 'pan-cursor': isSpacePressed || isMiddlePressed }"
    @wheel.capture="handleWheel"
    @mousedown="handleContainerMouseDown"
  >
    <SketchRuler
      ref="sketchRef"
      :width="viewportWidth"
      :height="viewportHeight"
      :canvas-width="canvasWidth"
      :canvas-height="canvasHeight"
      :scale="localScale"
      :offset="localOffset"
      :show-ruler="store.canvas.showRuler"
      :is-show-refer-line="store.canvas.showGuides"
      :lines="linesRef"
      :min-zoom="0.1"
      :max-zoom="5"
      :palette="rulerPalette"
      @update:scale="handleScaleUpdate"
      @update:offset="handleOffsetUpdate"
      @update:lines="handleLinesChange"
      @zoomchange="handleZoomChange"
    >
      <template #default>
        <div
          class="canvas-content"
          :style="{
            width: canvasWidth + 'px',
            height: canvasHeight + 'px',
            backgroundColor: store.canvas.backgroundColor,
          }"
          @click.self="store.selectComponent(null)"
          @drop="handleDrop"
          @dragover.prevent
        >
          <div v-if="store.canvas.showGrid" class="grid-background" />

          <template v-for="comp in store.components" :key="comp.id">
            <div
              v-show="comp.visible"
              class="canvas-component"
              :class="{
                selected: comp.id === store.selectedId,
                locked: comp.locked,
                'drag-disabled': isSpacePressed,
              }"
              :style="{
                left: comp.x + 'px',
                top: comp.y + 'px',
                width: comp.width + 'px',
                height: comp.height + 'px',
                zIndex: comp.zIndex,
              }"
              @click.stop="handleSelect(comp.id)"
              @mousedown.stop="handleComponentMouseDown($event, comp.id)"
            >
              <div v-if="comp.id === store.selectedId" class="selection-border">
                <div
                  v-for="handle in resizeHandles"
                  :key="handle.position"
                  class="resize-handle"
                  :class="handle.position"
                  @mousedown.stop="handleResizeStart($event, comp.id, handle.position)"
                />
              </div>
              <div class="component-content">
                <component-renderer :component="comp" />
              </div>
            </div>
          </template>
        </div>
      </template>
    </SketchRuler>

    <div v-if="store.components.length === 0" class="empty-canvas">
      <el-icon :size="64" color="#9ca3af"><Plus /></el-icon>
      <p>拖拽组件到画布，或点击左侧组件库添加</p>
    </div>

    <div class="canvas-info-bar">
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
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { SketchRuler } from 'vue3-sketch-ruler'
import type { GuideLine } from '@/views/bi-editor/types'
import { useBiEditorStore } from '@/stores/bi-editor'
import ComponentRenderer from './ComponentRenderer.vue'
import 'vue3-sketch-ruler/lib/style.css'

const emit = defineEmits<{
  (e: 'select-component', id: string | null): void
}>()

const store = useBiEditorStore()

// ========== Viewport dimensions ==========
const containerRef = ref<HTMLElement | null>(null)
const viewportWidth = ref(1400)
const viewportHeight = ref(800)

let resizeObserver: ResizeObserver | null = null

// ========== SketchRuler refs ==========
const sketchRef = shallowRef<InstanceType<typeof SketchRuler> | null>(null)
const localScale = ref(store.canvas.zoom)
const localOffset = ref({ x: 0, y: 0 })

// ========== Infinite canvas dimensions ==========
// Padding around content for scrolling beyond components
const INFINITE_PADDING = 10000
const BASE_CANVAS_SIZE = 10000

const canvasWidth = computed(() => {
  const rightEdge = store.components.reduce((max, c) => Math.max(max, c.x + c.width), 0)
  return Math.max(
    store.canvas.width + INFINITE_PADDING,
    rightEdge + INFINITE_PADDING,
    BASE_CANVAS_SIZE,
  )
})

const canvasHeight = computed(() => {
  const bottomEdge = store.components.reduce((max, c) => Math.max(max, c.y + c.height), 0)
  return Math.max(
    store.canvas.height + INFINITE_PADDING,
    bottomEdge + INFINITE_PADDING,
    BASE_CANVAS_SIZE,
  )
})

// ========== Pan mode state ==========
const isSpacePressed = ref(false)
const isMiddlePressed = ref(false)
let isPanning = false
let panStartPos = { x: 0, y: 0 }
let panStartOffset = { x: 0, y: 0 }
let panMouseMoveHandler: ((e: MouseEvent) => void) | null = null
let panMouseUpHandler: ((e?: MouseEvent) => void) | null = null

// ========== Scale sync ==========
watch(
  () => store.canvas.zoom,
  (val) => {
    if (Math.abs(val - localScale.value) > 0.001) {
      localScale.value = val
    }
  },
)

function handleScaleUpdate(scale: number) {
  localScale.value = scale
  if (Math.abs(scale - store.canvas.zoom) > 0.001) {
    store.setZoom(scale)
  }
}

function handleOffsetUpdate(offset: { x: number; y: number }) {
  localOffset.value = { ...offset }
}

function handleZoomChange(detail: { scale: number; x: number; y: number }) {
  localScale.value = detail.scale
  localOffset.value = { x: detail.x, y: detail.y }
}

// ========== Wheel pan ==========
function handleWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    // Let SketchRuler handle zoom with Ctrl/Cmd + wheel
    return
  }

  // Stop propagation so SketchRuler doesn't try to handle wheel for zoom
  e.preventDefault()
  e.stopPropagation()

  const scrollSpeed = 1.5 / localScale.value

  if (e.shiftKey) {
    localOffset.value = {
      ...localOffset.value,
      x: localOffset.value.x - e.deltaY * scrollSpeed,
    }
  } else {
    localOffset.value = {
      ...localOffset.value,
      y: localOffset.value.y - e.deltaY * scrollSpeed,
    }
  }
}

// ========== Pan mode (Space + drag or Middle-click drag) ==========
function startPan(e: MouseEvent) {
  e.preventDefault()
  isPanning = true
  isMiddlePressed.value = true
  panStartPos = { x: e.clientX, y: e.clientY }
  panStartOffset = { ...localOffset.value }

  panMouseMoveHandler = (ev: MouseEvent) => {
    if (!isPanning) return
    const deltaX = ev.clientX - panStartPos.x
    const deltaY = ev.clientY - panStartPos.y
    localOffset.value = {
      x: panStartOffset.x + deltaX,
      y: panStartOffset.y + deltaY,
    }
  }

  panMouseUpHandler = () => {
    isPanning = false
    isMiddlePressed.value = false
    if (panMouseMoveHandler) {
      document.removeEventListener('mousemove', panMouseMoveHandler)
      panMouseMoveHandler = null
    }
    if (panMouseUpHandler) {
      document.removeEventListener('mouseup', panMouseUpHandler)
      panMouseUpHandler = null
    }
  }

  document.addEventListener('mousemove', panMouseMoveHandler)
  document.addEventListener('mouseup', panMouseUpHandler)
}

function handleContainerMouseDown(e: MouseEvent) {
  // Middle mouse button or Space + left mouse button = pan mode
  if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
    startPan(e)
  }
}

function handleComponentMouseDown(e: MouseEvent, id: string) {
  // When Space is pressed, prevent component interaction (enable pan mode on canvas)
  if (isSpacePressed.value) {
    e.preventDefault()
    e.stopPropagation()
    startPan(e)
    return
  }
  // Normal click - select the component
  // Component move/drag is handled by existing handlers
}

// ========== Space key tracking ==========
function handleKeyDown(e: KeyboardEvent) {
  // Don't trigger pan shortcuts when typing in input fields
  const tag = (e.target as HTMLElement)?.tagName
  const isInput =
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (e.target as HTMLElement)?.isContentEditable

  if (e.code === 'Space' && !e.repeat && !isInput) {
    isSpacePressed.value = true
  }
  // Escape to cancel pan/drag
  if (e.code === 'Escape' && isPanning) {
    panMouseUpHandler?.()
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    isSpacePressed.value = false
  }
}

// ========== Guide lines sync ==========
const linesRef = ref(toRulerLines(store.guides))

watch(
  () => store.guides,
  (newGuides) => {
    const newRulerLines = toRulerLines(newGuides)
    if (JSON.stringify(newRulerLines) !== JSON.stringify(linesRef.value)) {
      linesRef.value = newRulerLines
    }
  },
  { deep: true },
)

function toRulerLines(guides: GuideLine[]): { h: number[]; v: number[] } {
  return {
    h: guides.filter((g) => g.direction === 'horizontal').map((g) => g.position),
    v: guides.filter((g) => g.direction === 'vertical').map((g) => g.position),
  }
}

function fromRulerLines(lines: { h: number[]; v: number[] }): GuideLine[] {
  const idPrefix = Date.now()
  return [
    ...lines.h.map(
      (pos, i) =>
        ({
          id: `h_${idPrefix}_${i}`,
          direction: 'horizontal' as const,
          position: pos,
        }) as GuideLine,
    ),
    ...lines.v.map(
      (pos, i) =>
        ({ id: `v_${idPrefix}_${i}`, direction: 'vertical' as const, position: pos }) as GuideLine,
    ),
  ]
}

function handleLinesChange(lines: { h: number[]; v: number[] }) {
  linesRef.value = lines
  store.setGuides(fromRulerLines(lines))
}

// ========== Ruler palette (dark theme) ==========
const rulerPalette = {
  bgColor: '#374151',
  tickColor: '#9ca3af',
  labelColor: '#d1d5db',
  guideLineColor: '#409eff',
  guideLineLockedColor: '#6b7280',
  borderColor: '#4b5563',
  shadowColor: 'rgba(64, 158, 255, 0.1)',
  guideLineStyle: 'dashed' as const,
  guideLineWidth: 1,
  labelEnabled: true,
}

// ========== Resize handles ==========
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

// ========== Component interactions ==========
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
      const rect = containerRef.value?.getBoundingClientRect()
      if (rect && sketchRef.value) {
        const viewportX = e.clientX - rect.left
        const viewportY = e.clientY - rect.top
        const worldPoint = sketchRef.value.engine.toWorldPoint(viewportX, viewportY)
        const x = worldPoint.x - meta.defaultWidth / 2
        const y = worldPoint.y - meta.defaultHeight / 2
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

  const state = sketchRef.value?.engine.getState()
  const scale = state?.scale ?? localScale.value
  const startX = e.clientX
  const startY = e.clientY
  const startComp = { ...comp }

  function handleMouseMove(ev: MouseEvent) {
    const deltaX = (ev.clientX - startX) / scale
    const deltaY = (ev.clientY - startY) / scale
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

// ========== Lifecycle ==========
onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        viewportWidth.value = entry.contentRect.width
        viewportHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (panMouseMoveHandler) {
    document.removeEventListener('mousemove', panMouseMoveHandler)
  }
  if (panMouseUpHandler) {
    document.removeEventListener('mouseup', panMouseUpHandler)
  }
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
  cursor: default;
}
.canvas-container.pan-cursor {
  cursor: grab;
}
.canvas-container.pan-cursor .canvas-component {
  cursor: grab;
}
.canvas-content {
  position: relative;
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
.canvas-component {
  position: absolute;
  cursor: move;
  user-select: none;
}
.canvas-component.drag-disabled {
  cursor: grab;
  pointer-events: none;
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
  z-index: 10;
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
</style>

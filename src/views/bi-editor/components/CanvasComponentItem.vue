<template>
  <div
    class="component-layout-box"
    :style="{
      position: 'absolute',
      left: `${comp.x}px`,
      top: `${comp.y}px`,
      width: `${comp.width}px`,
      height: `${comp.height}px`,
      zIndex: comp.zIndex,
      opacity: comp.visible ? undefined : 0,
      pointerEvents: comp.visible ? undefined : 'none',
    }"
    @click.self="emit('select', comp.id)"
    @mousedown="(e: any) => emit('wrapper-mousedown', e, comp.id)"
  >
    <div v-if="comp.id === selectedId" class="selection-border">
      <div
        v-for="handle in resizeHandles"
        :key="handle.position"
        class="resize-handle"
        :class="handle.position"
        @mousedown.stop="emit('resize-start', $event, comp.id, handle.position)"
      />
    </div>

    <component
      :is="VueDragResize"
      :x="comp.x"
      :y="comp.y"
      :w="comp.width"
      :h="comp.height"
      :z="comp.zIndex"
      :isActive="comp.id === selectedId"
      :isDraggable="comp.visible && !comp.locked && !isSpacePressed && !isPanning"
      :isResizable="false"
      :parentScaleX="1"
      :parentScaleY="1"
      :snapToGrid="false"
      :gridX="1"
      :gridY="1"
      :minw="1"
      :minh="1"
      :parentLimitation="false"
      @dragging="(rect: any) => emit('vdr-dragging', comp.id, rect)"
      @dragstop="(rect: any) => emit('vdr-dragstop', comp.id, rect)"
      @activated="emit('vdr-activated', comp.id)"
      @clicked="emit('vdr-clicked', comp.id)"
    >
      <div
        class="canvas-component-wrapper-inner"
        :class="{
          selected: comp.id === selectedId,
          locked: comp.locked,
          'drag-disabled': isSpacePressed || isPanning,
        }"
      >
        <div class="component-content">
          <ComponentRenderer :component="comp as any" />
        </div>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import VueDragResizeRaw from 'vue3-drag-resize'
import ComponentRenderer from './ComponentRenderer.vue'
import type { ResizeHandle } from '@/views/bi-editor/composables/useCanvasInteraction'

const VueDragResize: Component =
  (VueDragResizeRaw as any)?.default?.default ??
  (VueDragResizeRaw as any)?.default ??
  VueDragResizeRaw

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
}

interface Props {
  comp: BiComponent
  selectedId: string | null
  resizeHandles: ResizeHandle[]
  isSpacePressed: boolean
  isPanning: boolean
}
defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'wrapper-mousedown', event: MouseEvent, id: string): void
  (e: 'resize-start', event: MouseEvent, id: string, handlePosition: string): void
  (
    e: 'vdr-dragging',
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ): void
  (
    e: 'vdr-dragstop',
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ): void
  (e: 'vdr-activated', id: string): void
  (e: 'vdr-clicked', id: string): void
}>()
</script>

<style scoped>
.canvas-component-wrapper-inner {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: move;
  box-sizing: border-box;
  user-select: none;
  pointer-events: auto !important;
}
.canvas-component-wrapper-inner.drag-disabled {
  cursor: grab;
}
.canvas-component-wrapper-inner.locked {
  cursor: not-allowed;
}
.canvas-component-wrapper-inner.selected {
  z-index: 9999;
}
:deep(.vdr) {
  background: transparent;
  border: none;
  box-shadow: none;
  box-sizing: border-box;
  overflow: visible;
}
.component-layout-box :deep(.vdr) {
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  transform: none !important;
}
:deep(.vdr.active::before) {
  display: none;
}
:deep(.vdr-stick) {
  display: none;
}
:deep(.content-container) {
  width: 100% !important;
  height: 100% !important;
  overflow: hidden;
  box-sizing: border-box;
  display: block;
}
:deep(.vdr::before),
:deep(.vdr-stick) {
  pointer-events: none !important;
}
:deep(.vdr) {
  pointer-events: auto;
}
.selection-border {
  position: absolute;
  inset: -1px;
  border: 2px solid var(--bi-accent, #409eff);
  pointer-events: none;
  z-index: 10000;
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
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
</style>

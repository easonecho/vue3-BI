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
      :key="vdrKey"
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
          <ComponentRenderer :component="comp" />
        </div>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
  type: string
  props: Record<string, any>
  style: Record<string, any>
}

interface Props {
  comp: BiComponent
  selectedId: string | null
  resizeHandles: ResizeHandle[]
  isSpacePressed: boolean
  isPanning: boolean
}
const props = defineProps<Props>()

/**
 * 🔑 强制重建 VueDragResize 的 key。
 *
 * 为什么需要：
 *   vue3-drag-resize 内部在 data 中保存 this.x / this.y 作为「拖拽起点」，
 *   mousedown 时把 this.x/y 记为 startX/startY，然后 mousemove 按 (mouseX - mouseDownX)
 *   做增量计算 rect.left = this.x + delta。
 *
 *   撤销/重做（undo/redo）会通过 restoreSnapshot 把 components.value 整体替换为一个
 *   全新的对象数组，每个 comp 的引用都会变化，但外层 CanvasArea.vue 用 v-for 的
 *   key=comp.id，导致 Vue 复用同一个组件实例，也就复用了同一个 VueDragResize 实例。
 *   此时 VDR 内部 this.x/y 仍然停留在「撤销前的旧位置」，下次 mousedown + 任何微小
 *   mouse move，rect.left 就会直接以撤销前位置为起点输出，导致组件瞬间跳回旧位置，
 *   表现为：点击下去的那一刻组件位置偏移。
 *
 * 修复策略：
 *   watch `() => props.comp`（引用本身），只要引用发生变化（不是 moveComponent 的
 *   浅改 x/y，而是 undo/redo/duplicate 等整体替换了 comp 对象），就把 vdrKey = genId()，
 *   强制销毁并重建 VueDragResize 实例，清空它内部保存的旧状态 this.x/y。
 *   正常拖拽（moveComponent 只改 comp.x / comp.y，comp 引用不变）不会触发重建。
 */
const getVdrKey = () => {
  const t = Date.now().toString(36)
  const rnd = crypto.getRandomValues(new Uint16Array(1))[0].toString(36)
  return `${t}_${rnd}`
}
const vdrKey = ref(getVdrKey())
watch(
  () => props.comp,
  () => {
    vdrKey.value = getVdrKey()
  },
  // 必须用 sync flush：否则 restore 宏任务→渲染→mousedown 已经按下了，watch 还没走
  { flush: 'sync' },
)

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

<style scoped lang="less">
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

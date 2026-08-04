<template>
  <template v-if="vertical.length || horizontal.length">
    <div
      v-for="x in vertical"
      :key="'snap-v-' + x"
      class="snap-line vertical"
      :style="{ left: `${x}px` }"
    />
    <div
      v-for="y in horizontal"
      :key="'snap-h-' + y"
      class="snap-line horizontal"
      :style="{ top: `${y}px` }"
    />
  </template>
</template>

<script setup lang="ts">
import { GUIDE_LINE_COLOR, SNAP_LINE_EXTENT } from '@/views/bi-editor/constants/canvas-constants'

interface Props {
  vertical: number[]
  horizontal: number[]
}
defineProps<Props>()
</script>

<style scoped>
.snap-line {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  background-color: transparent;
  background-repeat: repeat;
}
.snap-line.vertical {
  width: 1px;
  top: calc(-1 * v-bind(SNAP_LINE_EXTENT) * 1px);
  height: calc(v-bind(SNAP_LINE_EXTENT) * 2 * 1px);
  left: 0;
  background-image: linear-gradient(
    to bottom,
    v-bind(GUIDE_LINE_COLOR) 0 6px,
    transparent 6px 10px
  );
  background-size: 1px 8px;
}
.snap-line.horizontal {
  height: 1px;
  left: calc(-1 * v-bind(SNAP_LINE_EXTENT) * 1px);
  width: calc(v-bind(SNAP_LINE_EXTENT) * 2 * 1px);
  top: 0;
  background-image: linear-gradient(to right, v-bind(GUIDE_LINE_COLOR) 0 6px, transparent 6px 10px);
  background-size: 8px 1px;
}
</style>

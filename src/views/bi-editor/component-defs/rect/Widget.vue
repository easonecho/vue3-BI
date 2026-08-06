<template>
  <div class="widget-rect" :style="rectStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const rectStyle = computed(() => ({
  backgroundColor: props.comp.style?.backgroundColor || '#e5e7eb',
  borderColor: props.comp.style?.borderColor || 'transparent',
  borderWidth: `${props.comp.style?.borderWidth || 0}px`,
  borderStyle: props.comp.style?.borderStyle || 'solid',
  borderRadius: `${props.comp.props?.borderRadius || 0}px`,
}))
</script>

<style scoped lang="less">
.widget-rect {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style>

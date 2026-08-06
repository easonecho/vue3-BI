<template>
  <div class="widget-line" :class="directionClass" :style="lineStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const directionClass = computed(() => {
  const dir = props.comp.props?.direction || 'horizontal'
  return `widget-line--${dir}`
})

const lineStyle = computed(() => ({
  backgroundColor: props.comp.style?.backgroundColor || '#999999',
  borderColor: props.comp.style?.borderColor || 'transparent',
  borderWidth: `${props.comp.style?.borderWidth || 0}px`,
  borderStyle: props.comp.style?.borderStyle || 'solid',
}))
</script>

<style scoped lang="less">
.widget-line {
  width: 100%;
  height: 100%;

  &--horizontal {
    height: 2px;
  }

  &--vertical {
    width: 2px;
  }
}
</style>

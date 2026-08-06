<template>
  <div class="widget-progress" :style="containerStyle">
    <div class="widget-progress__track">
      <div class="widget-progress__fill" :style="fillStyle" />
    </div>
    <span v-if="showLabel" class="widget-progress__label">{{ percent }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const value = computed(() => props.comp.props?.value ?? 0)
const max = computed(() => props.comp.props?.max ?? 100)
const showLabel = computed(() => props.comp.props?.showLabel ?? true)

const percent = computed(() => {
  const v = value.value
  const m = max.value || 100
  return Math.round((Math.min(v, m) / m) * 100)
})

const fillStyle = computed(() => ({
  width: `${percent.value}%`,
  backgroundColor: props.comp.props?.color || '#5470c6',
  borderRadius: `${props.comp.props?.borderRadius || 4}px`,
  transition: 'width 0.3s ease',
}))

const containerStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: `${props.comp.props?.labelGap || 8}px`,
}))
</script>

<style scoped lang="less">
.widget-progress {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;

  &__track {
    flex: 1;
    height: 100%;
    min-height: 8px;
    background: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: inherit;
  }

  &__label {
    font-size: 14px;
    color: #6b7280;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
}
</style>

<template>
  <div class="widget-indicator" :style="containerStyle">
    <span v-if="title" class="widget-indicator__title" :style="titleStyle">{{ title }}</span>
    <div class="widget-indicator__value-row">
      <span v-if="prefix" class="widget-indicator__prefix">{{ prefix }}</span>
      <span class="widget-indicator__value" :style="valueStyle">{{ displayValue }}</span>
      <span v-if="unit" class="widget-indicator__unit">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const title = computed(() => props.comp.props?.title || '')
const prefix = computed(() => props.comp.props?.prefix || '')
const unit = computed(() => props.comp.props?.unit || '')

const displayValue = computed(() => {
  const val = props.comp.props?.value ?? 0
  const decimals = props.comp.props?.decimals
  if (typeof decimals === 'number') {
    return Number(val).toFixed(decimals)
  }
  return String(val)
})

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
}))

const titleStyle = computed(() => ({
  fontSize: `${props.comp.props?.titleFontSize || 14}px`,
  color: props.comp.props?.titleColor || '#6b7280',
  fontWeight: props.comp.props?.titleFontWeight || 'normal',
}))

const valueStyle = computed(() => ({
  fontSize: `${props.comp.props?.fontSize || 28}px`,
  color: props.comp.props?.color || '#111827',
  fontWeight: props.comp.props?.fontWeight || 'bold',
  fontVariantNumeric: 'tabular-nums',
}))
</script>

<style scoped lang="less">
.widget-indicator {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  user-select: none;

  &__title {
    font-size: 14px;
    color: #6b7280;
    text-align: center;
  }

  &__value-row {
    display: flex;
    align-items: baseline;
    gap: 2px;
  }

  &__prefix {
    font-size: 0.6em;
    color: #6b7280;
  }

  &__value {
    font-variant-numeric: tabular-nums;
  }

  &__unit {
    font-size: 0.5em;
    color: #6b7280;
  }
}
</style>

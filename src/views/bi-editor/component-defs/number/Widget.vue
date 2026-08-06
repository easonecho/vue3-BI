<template>
  <div class="widget-number" :style="containerStyle">
    <span v-if="prefix" class="widget-number__prefix">{{ prefix }}</span>
    <span class="widget-number__value">{{ displayValue }}</span>
    <span v-if="suffix" class="widget-number__suffix">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const displayValue = computed(() => {
  const val = props.comp.props?.value ?? 0
  const decimals = props.comp.props?.decimals
  if (typeof decimals === 'number') {
    return Number(val).toFixed(decimals)
  }
  return String(val)
})

const prefix = computed(() => props.comp.props?.prefix || '')
const suffix = computed(() => props.comp.props?.suffix || '')

const containerStyle = computed(() => ({
  fontSize: `${props.comp.props?.fontSize || 24}px`,
  color: props.comp.props?.color || '#111827',
  fontWeight: props.comp.props?.fontWeight || 'bold',
  textAlign: props.comp.props?.textAlign || 'center',
  fontFamily:
    props.comp.props?.fontFamily ||
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontVariantNumeric: 'tabular-nums',
}))
</script>

<style scoped lang="less">
.widget-number {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  user-select: none;

  &__prefix,
  &__suffix {
    font-size: 0.6em;
    color: #6b7280;
    font-weight: normal;
  }

  &__value {
    font-variant-numeric: tabular-nums;
  }
}
</style>

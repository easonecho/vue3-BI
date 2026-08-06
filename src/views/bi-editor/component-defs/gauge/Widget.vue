<template>
  <div class="widget-gauge" :style="containerStyle">
    <svg class="widget-gauge__svg" viewBox="0 0 200 120">
      <!-- 背景弧 -->
      <path
        class="widget-gauge__track"
        :d="trackPath"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
        fill="none"
        stroke-linecap="round"
      />
      <!-- 数值弧 -->
      <path
        class="widget-gauge__value"
        :d="valuePath"
        :stroke="valueColor"
        :stroke-width="strokeWidth"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
    <div class="widget-gauge__center">
      <span class="widget-gauge__val">{{ percent }}%</span>
      <span v-if="unit" class="widget-gauge__unit">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const value = computed(() => props.comp.props?.value ?? 0)
const max = computed(() => props.comp.props?.max ?? 100)
const unit = computed(() => props.comp.props?.unit || '')

const percent = computed(() => {
  const v = value.value
  const m = max.value || 100
  return Math.round((Math.min(v, m) / m) * 100)
})

const strokeWidth = 16
const radius = 80
const centerX = 100
const centerY = 100

// 半圆 gauge：从 180° 到 360°（即上半圆）
const trackPath = computed(() => {
  const startAngle = Math.PI
  const endAngle = 2 * Math.PI
  const x1 = centerX + radius * Math.cos(startAngle)
  const y1 = centerY + radius * Math.sin(startAngle)
  const x2 = centerX + radius * Math.cos(endAngle)
  const y2 = centerY + radius * Math.sin(endAngle)
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
})

const valuePath = computed(() => {
  const p = percent.value
  const endAngle = Math.PI + (Math.PI * p) / 100
  const x1 = centerX + radius * Math.cos(Math.PI)
  const y1 = centerY + radius * Math.sin(Math.PI)
  const x2 = centerX + radius * Math.cos(endAngle)
  const y2 = centerY + radius * Math.sin(endAngle)
  const largeArc = p > 50 ? 1 : 0
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
})

const trackColor = computed(() => props.comp.props?.trackColor || '#e5e7eb')
const valueColor = computed(() => props.comp.props?.color || '#5470c6')

const containerStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))
</script>

<style scoped lang="less">
.widget-gauge {
  width: 100%;
  height: 100%;
  position: relative;

  &__svg {
    width: 100%;
    height: 100%;
    max-height: 100%;
  }

  &__center {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    display: flex;
    align-items: baseline;
    gap: 2px;
  }

  &__val {
    font-size: 24px;
    font-weight: bold;
    color: #111827;
  }

  &__unit {
    font-size: 14px;
    color: #6b7280;
  }
}
</style>

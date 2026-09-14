<template>
  <div class="widget-flip-number" :style="containerStyle">
    <span v-if="prefix" class="widget-flip-number__prefix">{{ prefix }}</span>
    <span class="widget-flip-number__value" :style="valueStyle">{{ displayStr }}</span>
    <span v-if="suffix" class="widget-flip-number__suffix">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const targetValue = computed(() => Number(props.comp.props?.value ?? 0))
const decimals = computed(() => props.comp.props?.decimals ?? 0)
const prefix = computed(() => props.comp.props?.prefix ?? '')
const suffix = computed(() => props.comp.props?.suffix ?? '')
const duration = computed(() => props.comp.props?.duration ?? 1500)
const separator = computed(() => props.comp.props?.separator ?? true)
const fontSize = computed(() => props.comp.props?.fontSize ?? 40)
const color = computed(() => props.comp.props?.color ?? '#22d3ee')
const fontWeight = computed(() => props.comp.props?.fontWeight ?? 'bold')
const flipColor = computed(() => props.comp.props?.flipColor ?? '#0e7490')

const current = ref(0)
let rafId: number | undefined
let startTime: number | undefined
let startVal = 0
const animating = ref(false)

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function animate(ts: number) {
  if (startTime === undefined) startTime = ts
  const elapsed = ts - startTime
  const t = Math.min(elapsed / duration.value, 1)
  const eased = easeOutCubic(t)
  current.value = startVal + (targetValue.value - startVal) * eased
  if (t < 1) {
    rafId = requestAnimationFrame(animate)
  } else {
    current.value = targetValue.value
    animating.value = false
    rafId = undefined
    startTime = undefined
  }
}

watch(
  targetValue,
  () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId)
      rafId = undefined
    }
    startTime = undefined
    startVal = current.value
    animating.value = true
    rafId = requestAnimationFrame(animate)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (rafId !== undefined) {
    cancelAnimationFrame(rafId)
    rafId = undefined
  }
})

function formatNumber(v: number) {
  const fixed = v.toFixed(decimals.value)
  if (!separator.value) return fixed
  const [intPart, decPart] = fixed.split('.')
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart !== undefined ? `${withSep}.${decPart}` : withSep
}

const displayStr = computed(() => formatNumber(current.value))

const containerStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: color.value,
  fontWeight: fontWeight.value,
  textShadow: animating.value ? `0 0 8px ${flipColor.value}` : 'none',
  transition: 'text-shadow 0.2s',
}))

const valueStyle = computed(() => ({
  fontVariantNumeric: 'tabular-nums',
}))
</script>

<style scoped lang="less">
.widget-flip-number {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  box-sizing: border-box;
  user-select: none;

  &__value {
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  &__prefix,
  &__suffix {
    font-size: 0.5em;
    opacity: 0.8;
    line-height: 1.1;
  }
}
</style>

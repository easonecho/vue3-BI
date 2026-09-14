<template>
  <div class="widget-clock" :style="containerStyle">
    <div class="widget-clock__time" :style="timeStyle">{{ timeStr }}</div>
    <div v-if="showDate || showWeek" class="widget-clock__meta">
      <span v-if="showDate" class="widget-clock__date" :style="dateStyle">{{ dateStr }}</span>
      <span v-if="showDate && showWeek" class="widget-clock__sep" :style="dateStyle">·</span>
      <span v-if="showWeek" class="widget-clock__week" :style="weekStyle">{{ weekStr }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const now = ref(new Date())
let timer: number | undefined

const showDate = computed(() => props.comp.props?.showDate ?? true)
const showWeek = computed(() => props.comp.props?.showWeek ?? true)
const showSeconds = computed(() => props.comp.props?.showSeconds ?? true)
const format24 = computed(() => props.comp.props?.format24 ?? true)
const fontSize = computed(() => props.comp.props?.fontSize ?? 32)
const dateFontSize = computed(() => props.comp.props?.dateFontSize ?? 14)
const color = computed(() => props.comp.props?.color ?? '#ffffff')
const weekColor = computed(() => props.comp.props?.weekColor ?? '#94a3b8')
const fontWeight = computed(() => props.comp.props?.fontWeight ?? 'bold')
const fontFamily = computed(() => props.comp.props?.fontFamily ?? 'Consolas, "Courier New", monospace')

const WEEKS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

const timeStr = computed(() => {
  const d = now.value
  let h = d.getHours()
  if (!format24.value) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    return `${pad(h)}:${pad(d.getMinutes())}${showSeconds.value ? `:${pad(d.getSeconds())}` : ''} ${ampm}`
  }
  return `${pad(h)}:${pad(d.getMinutes())}${showSeconds.value ? `:${pad(d.getSeconds())}` : ''}`
})

const dateStr = computed(() => {
  const d = now.value
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

const weekStr = computed(() => WEEKS[now.value.getDay()])

const containerStyle = computed(() => ({
  fontFamily: fontFamily.value,
}))

const timeStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: color.value,
  fontWeight: fontWeight.value,
}))

const dateStyle = computed(() => ({
  fontSize: `${dateFontSize.value}px`,
  color: color.value,
}))

const weekStyle = computed(() => ({
  fontSize: `${dateFontSize.value}px`,
  color: weekColor.value,
}))

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
})
</script>

<style scoped lang="less">
.widget-clock {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  user-select: none;
  font-variant-numeric: tabular-nums;

  &__time {
    line-height: 1.2;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.2;
    white-space: nowrap;
  }
}
</style>

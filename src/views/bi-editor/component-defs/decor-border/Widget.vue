<template>
  <div class="widget-decor-border" :class="`widget-decor-border--${style}`" :style="containerStyle">
    <span
      v-for="c in corners"
      :key="c.pos"
      class="widget-decor-border__corner"
      :class="`widget-decor-border__corner--${c.pos}`"
      :style="c.style"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const style = computed(() => props.comp.props?.style ?? 'corner')
const borderColor = computed(() => props.comp.props?.borderColor ?? '#22d3ee')
const cornerColor = computed(() => props.comp.props?.cornerColor ?? '#67e8f9')
const bgColor = computed(() => props.comp.props?.bgColor ?? 'rgba(15,23,42,0.4)')
const borderWidth = computed(() => props.comp.props?.borderWidth ?? 2)
const cornerSize = computed(() => props.comp.props?.cornerSize ?? 16)
const showCorner = computed(() => props.comp.props?.showCorner ?? true)
const bgImage = computed(() => props.comp.props?.bgImage ?? '')

const containerStyle = computed<CSSProperties>(() => {
  const base: CSSProperties = {
    border: `${borderWidth.value}px solid ${borderColor.value}`,
    background: bgColor.value,
  }
  // 🔑 用户从素材库选择了背景图时，叠加在背景色之上
  if (bgImage.value) {
    base.backgroundImage = `url("${bgImage.value}")`
    base.backgroundSize = 'cover'
    base.backgroundPosition = 'center'
  }
  if (style.value === 'grid' && !bgImage.value) {
    base.backgroundImage = `linear-gradient(${borderColor.value} 1px, transparent 1px), linear-gradient(90deg, ${borderColor.value} 1px, transparent 1px)`
    base.backgroundSize = '20px 20px'
  }
  if (style.value === 'flow') {
    base.boxShadow = `0 0 10px ${borderColor.value}, inset 0 0 8px ${borderColor.value}`
  }
  return base
})

const corners = computed(() => {
  if (!showCorner.value || style.value !== 'corner') return [] as { pos: string; style: CSSProperties }[]
  const size = cornerSize.value
  const w = 3
  const offset = `-${borderWidth.value}px`
  const make = (pos: 'tl' | 'tr' | 'bl' | 'br'): CSSProperties => {
    const s: CSSProperties = {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      borderColor: cornerColor.value,
      borderStyle: 'solid',
      borderWidth: 0,
    }
    if (pos === 'tl') {
      s.top = offset
      s.left = offset
      s.borderTopWidth = `${w}px`
      s.borderLeftWidth = `${w}px`
    } else if (pos === 'tr') {
      s.top = offset
      s.right = offset
      s.borderTopWidth = `${w}px`
      s.borderRightWidth = `${w}px`
    } else if (pos === 'bl') {
      s.bottom = offset
      s.left = offset
      s.borderBottomWidth = `${w}px`
      s.borderLeftWidth = `${w}px`
    } else {
      s.bottom = offset
      s.right = offset
      s.borderBottomWidth = `${w}px`
      s.borderRightWidth = `${w}px`
    }
    return s
  }
  return (['tl', 'tr', 'bl', 'br'] as const).map((pos) => ({ pos, style: make(pos) }))
})
</script>

<style scoped lang="less">
.widget-decor-border {
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
  user-select: none;

  &__corner {
    display: block;
    pointer-events: none;
  }
}
</style>

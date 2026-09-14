<template>
  <div class="widget-video-player" :style="containerStyle">
    <video
      ref="videoRef"
      class="widget-video-player__video"
      :src="videoSrc || undefined"
      :poster="poster || undefined"
      :autoplay="effectiveAutoplay"
      :loop="loop"
      :muted="effectiveMuted"
      :controls="controls"
      playsinline
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const videoRef = ref<HTMLVideoElement | null>(null)

const videoSrc = computed(() => props.comp.props?.src ?? '')
const poster = computed(() => props.comp.props?.poster ?? '')
const autoplay = computed(() => props.comp.props?.autoplay ?? false)
const loop = computed(() => props.comp.props?.loop ?? true)
const muted = computed(() => props.comp.props?.muted ?? true)
const controls = computed(() => props.comp.props?.controls ?? true)
const objectFit = computed(() => props.comp.props?.objectFit ?? 'contain')

/**
 * 自动播放需要静音才能在浏览器中生效。
 * 若用户启用 autoplay 但未启用 muted，则强制按静音处理。
 */
const effectiveMuted = computed(() => {
  if (autoplay.value && !muted.value) return true
  return muted.value
})

const effectiveAutoplay = computed(() => autoplay.value)

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
}))

const videoStyle = computed(() => ({
  objectFit: objectFit.value,
}))

/**
 * 监听 src/poster 变化时调用 video.load() 重新加载资源。
 */
watch(
  [videoSrc, poster],
  () => {
    const el = videoRef.value
    if (!el) return
    // 重新载入资源（HTMLVideoElement.load 会重置元素状态）
    el.load()
  },
  { flush: 'post' },
)

onMounted(() => {
  const el = videoRef.value
  if (!el) return
  // 初次挂载后强制应用 muted（部分浏览器对 autoplay 属性的静音要求严格）
  el.muted = effectiveMuted.value
})
</script>

<style scoped lang="less">
.widget-video-player {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  user-select: none;
  background: #000;
  overflow: hidden;

  &__video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }
}
</style>

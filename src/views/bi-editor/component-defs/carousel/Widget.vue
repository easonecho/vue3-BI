<template>
  <div class="widget-carousel" :style="containerStyle">
    <div
      class="widget-carousel__track"
      :class="{ 'is-fade': effect === 'fade' }"
      :style="trackStyle"
    >
      <div
        v-for="(img, i) in images"
        :key="i"
        class="widget-carousel__slide"
        :class="effect === 'fade' ? { 'is-active': i === currentIndex } : null"
        :style="slideStyle(i)"
      >
        <img
          v-if="!failedSet.has(i)"
          :src="img"
          class="widget-carousel__img"
          @error="onImgError(i)"
        />
        <div v-else class="widget-carousel__placeholder">
          <span>图片加载失败</span>
        </div>
      </div>
    </div>

    <template v-if="showArrow">
      <button
        class="widget-carousel__arrow widget-carousel__arrow--prev"
        :style="arrowStyle"
        @click="prev"
      >
        ‹
      </button>
      <button
        class="widget-carousel__arrow widget-carousel__arrow--next"
        :style="arrowStyle"
        @click="next"
      >
        ›
      </button>
    </template>

    <div v-if="showIndicator" class="widget-carousel__indicators">
      <span
        v-for="(img, i) in images"
        :key="i"
        class="widget-carousel__indicator"
        :style="indicatorStyle(i)"
        @click="setIndex(i)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const images = computed<string[]>(() => {
  const arr = props.comp.props?.images
  if (Array.isArray(arr) && arr.length > 0) return arr as string[]
  return []
})

const interval = computed(() => Number(props.comp.props?.interval ?? 3000))
const autoplay = computed(() => props.comp.props?.autoplay ?? true)
const showArrow = computed(() => props.comp.props?.showArrow ?? true)
const showIndicator = computed(() => props.comp.props?.showIndicator ?? true)
const effect = computed(() => props.comp.props?.effect ?? 'slide')
const arrowColor = computed(() => props.comp.props?.arrowColor ?? '#ffffff')
const indicatorColor = computed(() => props.comp.props?.indicatorColor ?? '#22d3ee')
const borderRadius = computed(() => Number(props.comp.props?.borderRadius ?? 4))

const currentIndex = ref(0)
const failedSet = ref<Set<number>>(new Set())

let timer: number | undefined

function startAuto() {
  stopAuto()
  if (!autoplay.value) return
  if (images.value.length <= 1) return
  timer = window.setInterval(() => {
    next()
  }, Math.max(1000, interval.value))
}

function stopAuto() {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}

function next() {
  const len = images.value.length
  if (len === 0) return
  currentIndex.value = (currentIndex.value + 1) % len
}

function prev() {
  const len = images.value.length
  if (len === 0) return
  currentIndex.value = (currentIndex.value - 1 + len) % len
}

function setIndex(i: number) {
  currentIndex.value = i
}

function onImgError(i: number) {
  failedSet.value.add(i)
  // 触发响应式更新
  failedSet.value = new Set(failedSet.value)
}

const containerStyle = computed(() => ({
  borderRadius: `${borderRadius.value}px`,
}))

function slideStyle(i: number) {
  if (effect.value === 'fade') {
    return {
      opacity: i === currentIndex.value ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }
  }
  return {}
}

const trackStyle = computed(() => {
  if (effect.value === 'fade') return {}
  return {
    transform: `translateX(-${currentIndex.value * 100}%)`,
    transition: 'transform 0.5s ease',
  }
})

const arrowStyle = computed(() => ({
  color: arrowColor.value,
}))

function indicatorStyle(i: number) {
  return {
    backgroundColor: i === currentIndex.value ? indicatorColor.value : 'rgba(255,255,255,0.4)',
    borderColor: i === currentIndex.value ? indicatorColor.value : 'transparent',
  }
}

// 监听 props 变化重启自动播放
watch(
  [autoplay, interval, images],
  () => {
    if (currentIndex.value >= images.value.length) {
      currentIndex.value = 0
    }
    startAuto()
  },
  { immediate: true, deep: false },
)

onBeforeUnmount(() => {
  stopAuto()
})
</script>

<style scoped lang="less">
.widget-carousel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  background: #0f172a;

  &__track {
    width: 100%;
    height: 100%;
    display: flex;
    transition: transform 0.5s ease;

    &.is-fade {
      position: relative;
    }
  }

  &__slide {
    position: relative;
    flex: 0 0 100%;
    width: 100%;
    height: 100%;

    .is-fade & {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #334155;
    color: #94a3b8;
    font-size: 13px;
  }

  &__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }

    &--prev {
      left: 8px;
    }

    &--next {
      right: 8px;
    }
  }

  &__indicators {
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 6px;
    pointer-events: none;
  }

  &__indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid transparent;
    cursor: pointer;
    pointer-events: auto;
    transition: all 0.2s;
  }
}
</style>

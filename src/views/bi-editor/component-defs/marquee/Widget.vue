<template>
  <div
    class="widget-marquee"
    :class="{ 'widget-marquee--pause-on-hover': pauseOnHover }"
    :style="containerStyle"
  >
    <div ref="trackRef" class="widget-marquee__track" :style="trackStyle">
      <span ref="textRef" class="widget-marquee__text">{{ content }}</span>
      <span class="widget-marquee__text">{{ content }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const content = computed(
  () => props.comp.props?.content ?? '欢迎使用 BI 编辑器，这是一个跑马灯组件示例',
)
const speed = computed(() => props.comp.props?.speed ?? 60)
const direction = computed(() => props.comp.props?.direction ?? 'left')
const pauseOnHover = computed(() => props.comp.props?.pauseOnHover ?? true)
const fontSize = computed(() => props.comp.props?.fontSize ?? 16)
const color = computed(() => props.comp.props?.color ?? '#1f2937')
const bgColor = computed(() => props.comp.props?.bgColor ?? 'transparent')

const trackRef = ref<HTMLElement | null>(null)
const textRef = ref<HTMLElement | null>(null)
const textWidth = ref(0)

// 不同方向用不同 keyframes，从 0 到 -50% 平移（track 内含两份相同文案）
const animationName = computed(() =>
  direction.value === 'left' ? 'marquee-left' : 'marquee-right',
)

// 动画时长 = 单份文案宽度 / 速度
const duration = computed(() => {
  const w = textWidth.value
  if (!w || !speed.value) return 0
  return w / speed.value
})

const containerStyle = computed(() => ({
  background: bgColor.value,
}))

const trackStyle = computed(() => {
  const style: Record<string, string> = {
    animationName: animationName.value,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    fontSize: `${fontSize.value}px`,
    color: color.value,
    animationDuration: duration.value > 0 ? `${duration.value}s` : '0s',
  }
  return style
})

function measureText() {
  if (textRef.value) {
    textWidth.value = textRef.value.offsetWidth
  }
}

onMounted(measureText)
// 文案或字号变化时重新测量，下一帧再读以拿到最新尺寸
watch([content, fontSize], () => {
  requestAnimationFrame(measureText)
})
</script>

<style scoped lang="less">
.widget-marquee {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: relative;

  &__track {
    display: inline-flex;
    white-space: nowrap;
    will-change: transform;
    animation-play-state: running;
  }

  &__text {
    display: inline-block;
    padding-right: 48px;
    white-space: nowrap;
  }
}

// 启用悬停暂停时，鼠标 hover 暂停动画
.widget-marquee--pause-on-hover:hover .widget-marquee__track {
  animation-play-state: paused;
}

@keyframes marquee-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes marquee-right {
  from {
    transform: translateX(-50%);
  }
  to {
    transform: translateX(0);
  }
}
</style>

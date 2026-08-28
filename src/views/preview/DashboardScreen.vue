<template>
  <div ref="wrapperRef" class="dashboard-screen-wrapper">
    <!-- 设计稿画布层：按设计稿原始尺寸渲染，用 scale 自适应屏幕 -->
    <div class="dashboard-screen-inner" :style="innerStyle">
      <div class="dashboard-canvas" :style="canvasStyle">
        <div
          v-for="comp in visibleSortedComponents"
          :key="comp.id"
          class="dashboard-comp"
          :style="getCompStyle(comp)"
        >
          <ComponentRenderer :component="comp" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import ComponentRenderer from '@/views/bi-editor/components/ComponentRenderer.vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const store = useBiEditorStore()
const wrapperRef = ref<HTMLElement | null>(null)

// 设计稿尺寸（画布编辑时设定的 width/height）
const designWidth = computed(() => store.canvas.width || 1920)
const designHeight = computed(() => store.canvas.height || 1080)

// 🔑 自适应缩放：监听容器尺寸，取 min(scaleX, scaleY) 保证画布完整显示不裁剪
const wrapperSize = ref({ w: 0, h: 0 })
let resizeObserver: ResizeObserver | null = null

const scale = computed(() => {
  const { w, h } = wrapperSize.value
  if (!w || !h) return 1
  return Math.min(w / designWidth.value, h / designHeight.value)
})

const innerStyle = computed(() => ({
  width: `${designWidth.value}px`,
  height: `${designHeight.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'center center',
}))

const canvasStyle = computed(() => {
  const s: Record<string, string> = {
    width: `${designWidth.value}px`,
    height: `${designHeight.value}px`,
    backgroundColor: store.canvas.backgroundColor || '#0d0d0f',
  }
  if (store.canvas.backgroundImage) {
    s.backgroundImage = `url(${store.canvas.backgroundImage})`
    s.backgroundSize = 'cover'
    s.backgroundPosition = 'center'
  }
  return s
})

function getCompStyle(comp: ComponentInstance) {
  return {
    position: 'absolute' as const,
    left: `${comp.x}px`,
    top: `${comp.y}px`,
    width: `${comp.width}px`,
    height: `${comp.height}px`,
    zIndex: comp.zIndex,
  }
}

// 可见组件按 zIndex 升序排列（zIndex 小的在底层）
const visibleSortedComponents = computed<ComponentInstance[]>(() =>
  store.components
    .filter((c) => c.visible)
    .sort((a, b) => a.zIndex - b.zIndex),
)

onMounted(() => {
  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      const e = entries[0]
      wrapperSize.value = { w: e.contentRect.width, h: e.contentRect.height }
    })
    resizeObserver.observe(wrapperRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped lang="less">
/* 大屏容器：铺满父级，flex 居中画布，背景使用主题变量 */
.dashboard-screen-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bi-bg);
  position: relative;

  /* 极淡网格背景，与全局风格统一 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--bi-grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--bi-grid-color) 1px, transparent 1px);
    background-size: var(--bi-grid-size) var(--bi-grid-size);
    pointer-events: none;
  }
}

/* 缩放层：固定设计稿尺寸，由 transform: scale 自适应 */
.dashboard-screen-inner {
  flex-shrink: 0;
  position: relative;
}

/* 画布本体：设计稿尺寸，组件绝对定位，克制阴影 */
.dashboard-canvas {
  position: relative;
  overflow: hidden;
  box-shadow: var(--bi-shadow-md);
  border: 1px solid var(--bi-border-color);
  border-radius: 0;
}

.dashboard-comp {
  position: absolute;
}
</style>

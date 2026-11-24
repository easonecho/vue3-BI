<template>
  <div
    ref="wrapperRef"
    class="dashboard-screen-wrapper"
    :class="{ 'is-scrollable': verticallyScrollable }"
  >
    <!-- 设计稿画布层：按设计稿原始尺寸渲染，用 scale 自适应屏幕 -->
    <div class="dashboard-screen-stage" :style="stageStyle">
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

    <!-- 竖屏提示：大屏画布在手机竖屏下过小，引导横屏查看 -->
    <div class="rotate-hint">{{ t('previewPage.rotateHint') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBiEditorStore } from '@/stores/bi-editor'
import ComponentRenderer from '@/views/bi-editor/components/canvas/ComponentRenderer.vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import {
  computeDashboardScale,
  isDashboardVerticallyScrollable,
} from '@/views/preview/utils/dashboard-fit'

const { t } = useI18n()
const store = useBiEditorStore()
const wrapperRef = ref<HTMLElement | null>(null)

// 设计稿尺寸（画布编辑时设定的 width/height）
const designWidth = computed(() => store.canvas.width || 1920)
const designHeight = computed(() => store.canvas.height || 1080)

// 🔑 自适应缩放：监听容器尺寸；宽屏完整显示，竖屏窄屏适配宽度
const wrapperSize = ref({ w: 0, h: 0 })
let resizeObserver: ResizeObserver | null = null

const scale = computed(() =>
  computeDashboardScale({
    viewportWidth: wrapperSize.value.w,
    viewportHeight: wrapperSize.value.h,
    designWidth: designWidth.value,
    designHeight: designHeight.value,
  }),
)

/** 缩放后画布高于视口时（竖屏长画布）允许纵向滚动，避免内容被裁剪 */
const verticallyScrollable = computed(() =>
  isDashboardVerticallyScrollable(designHeight.value, scale.value, wrapperSize.value.h),
)

/** 舞台层占据缩放后的真实尺寸，让纵向滚动与居中基于缩放结果 */
const stageStyle = computed(() => ({
  width: `${designWidth.value * scale.value}px`,
  height: `${designHeight.value * scale.value}px`,
}))

const innerStyle = computed(() => ({
  width: `${designWidth.value}px`,
  height: `${designHeight.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
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
  store.components.filter((c) => c.visible).sort((a, b) => a.zIndex - b.zIndex),
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
  /* 作为纵向 flex 子项（分享页带标题栏）时占满剩余空间 */
  flex: 1 1 auto;
  min-height: 0;
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

/* 舞台层：占据缩放后的真实尺寸，参与居中/纵向滚动 */
.dashboard-screen-stage {
  flex-shrink: 0;
  position: relative;
}

/* 缩放层：固定设计稿尺寸，由 transform: scale 自适应 */
.dashboard-screen-inner {
  position: absolute;
  left: 0;
  top: 0;
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

/* 竖屏长画布：允许纵向滚动，画布顶部对齐 */
.dashboard-screen-wrapper.is-scrollable {
  overflow-x: hidden;
  overflow-y: auto;
  /* 预留滚动条槽位，避免出现/消失引起宽度与缩放反复抖动 */
  scrollbar-gutter: stable;
  align-items: flex-start;
  padding: 12px 0;
  box-sizing: border-box;
}

/* 横屏提示：仅手机竖屏显示 */
.rotate-hint {
  display: none;
}

@media (max-width: 768px) and (orientation: portrait) {
  .rotate-hint {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 999px;
    background: var(--bi-glass-bg);
    border: 1px solid var(--bi-glass-border);
    color: var(--bi-text-secondary);
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 5;
  }
}
</style>

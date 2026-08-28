<template>
  <div
    ref="previewRootRef"
    class="preview-page"
    :class="{ 'pure-mode': pureMode, 'fullscreen-mode': isFullscreen }"
    v-loading="loading"
    @mousemove="handleMouseMove"
    @mouseleave="hideToolbar"
  >
    <!-- 🔑 企业级数据大屏渲染层：铺满整个视口，scale 自适应 -->
    <DashboardScreen v-if="!loading && !loadError" />

    <!-- 浮动工具栏：hover 显示，不占用画布空间 -->
    <transition name="toolbar-slide">
      <div v-show="showToolbar" class="preview-header">
        <el-button text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="preview-title">{{ store.dashboardName }}</span>
        <span class="preview-spacer"></span>
        <span v-if="lastRefreshAt" class="refresh-time">
          <el-icon><Clock /></el-icon>
          {{ formatTime(lastRefreshAt) }}
        </span>
        <el-tooltip content="手动刷新 (R)" placement="bottom">
          <el-button text :loading="refreshing" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip :content="pureMode ? '显示工具栏 (H)' : '纯净模式 (H)'" placement="bottom">
          <el-button text @click="togglePureMode">
            <el-icon><component :is="pureMode ? Menu : Hide" /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip :content="isFullscreen ? '退出全屏 (F/Esc)' : '全屏 (F)'" placement="bottom">
          <el-button text @click="toggleFullscreen">
            <el-icon><component :is="isFullscreen ? CloseBold : FullScreen" /></el-icon>
          </el-button>
        </el-tooltip>
        <el-divider direction="vertical" />
        <el-select
          v-model="autoRefreshInterval"
          size="small"
          style="width: 110px"
          placeholder="自动刷新"
          @change="resetAutoRefresh"
        >
          <el-option label="关闭" :value="0" />
          <el-option label="30 秒" :value="30" />
          <el-option label="1 分钟" :value="60" />
          <el-option label="5 分钟" :value="300" />
        </el-select>
      </div>
    </transition>

    <!-- 加载失败提示 -->
    <div v-if="!loading && loadError" class="preview-error">
      <el-empty :description="loadError">
        <el-button @click="handleBack">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 纯静模式下的悬浮指示 -->
    <transition name="fade">
      <div v-if="pureMode && !showToolbar" class="pure-hint">
        <el-icon><Menu /></el-icon>
        <span>移动鼠标显示工具栏</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Refresh,
  FullScreen,
  CloseBold,
  Hide,
  Menu,
  Clock,
} from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import DashboardScreen from './DashboardScreen.vue'
import { toJpeg } from 'html-to-image'
import { updateDashboardTemplate } from '@/api/dashboard-template'

const route = useRoute()
const router = useRouter()
const store = useBiEditorStore()

const loading = ref(false)
const loadError = ref('')
const refreshing = ref(false)
const lastRefreshAt = ref<Date | null>(null)

// ========== 工具栏显示控制 ==========
const showToolbar = ref(true)
const pureMode = ref(false)
const isFullscreen = ref(false)
const previewRootRef = ref<HTMLElement | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function handleMouseMove() {
  showToolbar.value = true
  scheduleHideToolbar()
}

function scheduleHideToolbar() {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    if (pureMode.value) showToolbar.value = false
  }, 2500)
}

function hideToolbar() {
  if (pureMode.value) showToolbar.value = false
}

// ========== 全屏控制 ==========
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await previewRootRef.value?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (e) {
    console.warn('[Preview] 全屏切换失败:', e)
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ========== 纯静模式 ==========
function togglePureMode() {
  pureMode.value = !pureMode.value
  if (pureMode.value) {
    showToolbar.value = true
    scheduleHideToolbar()
  } else {
    showToolbar.value = true
    if (hideTimer) clearTimeout(hideTimer)
  }
}

// ========== 自动刷新 ==========
const autoRefreshInterval = ref(0)
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

function resetAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (autoRefreshInterval.value > 0) {
    autoRefreshTimer = setInterval(() => {
      handleRefresh(true)
    }, autoRefreshInterval.value * 1000)
  }
}

// ========== 手动刷新 ==========
async function handleRefresh(silent = false) {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await store.refreshAllData()
    lastRefreshAt.value = new Date()
    void silent
  } catch (e) {
    console.error('[Preview] 刷新失败:', e)
  } finally {
    refreshing.value = false
  }
}

// ========== 键盘快捷键 ==========
function handleKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

  switch (e.key.toLowerCase()) {
    case 'f':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'h':
      e.preventDefault()
      togglePureMode()
      break
    case 'r':
      e.preventDefault()
      handleRefresh()
      break
    case 'escape':
      if (pureMode.value) {
        pureMode.value = false
        showToolbar.value = true
      }
      break
  }
}

// ========== 模板缩略图生成 ==========
async function generateTemplateThumbnail(templateId: number) {
  try {
    await new Promise((r) => setTimeout(r, 3000))
    const canvasEl = document.querySelector('.dashboard-canvas') as HTMLElement | null
    if (!canvasEl) return
    const dataUrl = await toJpeg(canvasEl, { quality: 0.7, backgroundColor: '#ffffff' })
    const thumbnail = await resizeDataUrl(dataUrl, 320)
    if (thumbnail) {
      await updateDashboardTemplate(templateId, { thumbnail })
      console.log('[Preview] 模板缩略图已更新:', templateId)
    }
  } catch (e) {
    console.warn('[Preview] 生成模板缩略图失败:', e)
  }
}

function resizeDataUrl(dataUrl: string, maxW: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = img.width > 0 ? Math.min(1, maxW / img.width) : 1
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      const ctx = cv.getContext('2d')
      if (!ctx) { resolve(null); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(cv.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}
// ========== 工具函数 ==========
function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function handleBack() {
  const isTemplate = route.name === 'PreviewTemplate'
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(isTemplate ? '/dashboard-templates' : '/dashboard')
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  const id = Number(route.params.id)
  const isTemplate = route.name === 'PreviewTemplate'
  if (!id || Number.isNaN(id)) {
    loadError.value = isTemplate ? '模板 ID 无效' : '看板 ID 无效'
    return
  }
  loading.value = true
  try {
    if (isTemplate) {
      await store.loadTemplate(id)
      generateTemplateThumbnail(id)
    } else {
      await store.loadDashboard(id)
    }
    lastRefreshAt.value = new Date()
  } catch {
    loadError.value = isTemplate ? '模板加载失败，可能已被删除或无访问权限' : '看板加载失败，可能已被删除或无访问权限'
  } finally {
    loading.value = false
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  window.removeEventListener('keydown', handleKeydown)
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  if (hideTimer) clearTimeout(hideTimer)
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
})
</script>

<style scoped lang="less">
.preview-page {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--bi-bg);

  &.pure-mode {
    cursor: none;

    &:hover {
      cursor: default;
    }
  }
}

/* 浮动工具栏：absolute 定位不占用画布空间，使用主题玻璃拟态变量 */
.preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 20px;
  background: var(--bi-glass-bg);
  backdrop-filter: blur(var(--bi-glass-blur));
  -webkit-backdrop-filter: blur(var(--bi-glass-blur));
  border-bottom: 1px solid var(--bi-glass-border);
  transition: background-color 0.2s ease, border-color 0.2s ease;

  /* 与全局按钮/文本风格统一 */
  .preview-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--bi-text-primary);
    margin-left: 8px;
    letter-spacing: 0.01em;
  }

  .preview-spacer {
    flex: 1;
  }

  .refresh-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--bi-text-secondary);
    margin-right: 4px;
    font-variant-numeric: tabular-nums;
  }

  :deep(.el-button.is-text) {
    color: var(--bi-text-secondary);
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.15s ease;

    &:hover {
      color: var(--bi-text-primary);
      background: var(--bi-component-hover-bg);
    }
  }

  :deep(.el-button.is-text.is-loading) {
    pointer-events: none;
  }

  :deep(.el-divider--vertical) {
    background-color: var(--bi-border-color);
    margin: 0 8px;
    height: 20px;
  }

  /* 自动刷新下拉框：与全局输入框视觉一致 */
  :deep(.el-select) {
    .el-input__wrapper {
      background: var(--bi-input-bg);
      box-shadow: 0 0 0 1px var(--bi-input-border) inset;
      transition: box-shadow 0.15s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--bi-accent) inset;
      }
      &.is-focus {
        box-shadow: 0 0 0 1px var(--bi-accent) inset,
          0 0 0 3px var(--bi-accent-glow);
      }
    }
    .el-input__inner {
      color: var(--bi-text-primary);
      font-size: 13px;
    }
  }

  /* 全屏模式下工具栏略微下沉，保留浮层感但不抢画面 */
  .fullscreen-mode & {
    top: 8px;
    left: 8px;
    right: 8px;
    border-radius: 8px;
    border: 1px solid var(--bi-glass-border);
  }
}

.preview-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bi-bg);
  z-index: 5;
}

/* 纯净模式提示：胶囊样式，克制点缀 */
.pure-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bi-glass-bg);
  border: 1px solid var(--bi-glass-border);
  border-radius: 999px;
  font-size: 12px;
  color: var(--bi-text-secondary);
  z-index: 30;
  pointer-events: none;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

// ========== 过渡动画：克制，时长统一 ==========
.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar-slide-enter-from,
.toolbar-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

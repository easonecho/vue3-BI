<template>
  <div
    ref="previewRootRef"
    class="preview-page"
    :class="{ 'pure-mode': pureMode, 'fullscreen-mode': isFullscreen }"
    v-loading="loading"
    @mousemove="handleMouseMove"
    @mouseleave="hideToolbar"
  >
    <!-- 预览态顶部工具栏:鼠标悬停显示 (纯静模式下也保留入口) -->
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

    <!-- 复用 CanvasArea readonly 模式:禁用拖拽/缩放/选中/标尺/网格/信息栏 -->
    <CanvasArea readonly />

    <div v-if="!loading && loadError" class="preview-error">
      <el-empty :description="loadError">
        <el-button @click="handleBack">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 纯静模式下的悬浮指示 (鼠标静止时给一个轻提示) -->
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
import CanvasArea from '@/views/bi-editor/components/CanvasArea.vue'

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
  // 纯静模式下 2.5 秒无操作隐藏工具栏;非纯静模式保持显示
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
    // 进入纯静模式:先显示工具栏,2.5s 后自动隐藏
    showToolbar.value = true
    scheduleHideToolbar()
  } else {
    showToolbar.value = true
    if (hideTimer) clearTimeout(hideTimer)
  }
}

// ========== 自动刷新 ==========
const autoRefreshInterval = ref(0) // 0 = 关闭,单位秒
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
    if (!silent) {
      // 静默自动刷新不打扰用户
    }
  } catch (e) {
    console.error('[Preview] 刷新失败:', e)
  } finally {
    refreshing.value = false
  }
}

// ========== 键盘快捷键 ==========
function handleKeydown(e: KeyboardEvent) {
  // 避免在输入框中触发
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
      // Esc 退出纯静模式 (全屏由浏览器自身处理)
      if (pureMode.value) {
        pureMode.value = false
        showToolbar.value = true
      }
      break
  }
}

// ========== 工具函数 ==========
function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  const id = Number(route.params.id)
  if (!id || Number.isNaN(id)) {
    loadError.value = '看板 ID 无效'
    return
  }
  loading.value = true
  try {
    await store.loadDashboard(id)
    lastRefreshAt.value = new Date()
  } catch {
    loadError.value = '看板加载失败,可能已被删除或无访问权限'
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
  // 离开预览页时退出全屏
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
})
</script>

<style scoped lang="less">
.preview-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bi-bg, #111827);
  overflow: hidden;
  position: relative;

  &.pure-mode {
    // 纯静模式下鼠标默认隐藏,移动时恢复 (由工具栏逻辑控制)
    cursor: none;

    &:hover {
      cursor: default;
    }
  }
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px;
  background: var(--bi-header-bg, #1f2937);
  border-bottom: 1px solid var(--bi-border-color, #374151);
  flex-shrink: 0;
  position: relative;
  z-index: 10;

  .preview-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--bi-text-primary, #f3f4f6);
    margin-left: 8px;
  }

  .preview-spacer {
    flex: 1;
  }

  .refresh-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--bi-text-secondary, #9ca3af);
    margin-right: 4px;
  }

  :deep(.el-button.is-text) {
    color: var(--bi-text-secondary, #9ca3af);
    padding: 6px 8px;

    &:hover {
      color: var(--bi-text-primary, #f3f4f6);
      background: var(--bi-hover-bg, rgba(255, 255, 255, 0.08));
    }
  }

  :deep(.el-divider--vertical) {
    border-color: var(--bi-border-color, #374151);
    margin: 0 4px;
  }

  :deep(.el-select) {
    .el-input__wrapper {
      background: var(--bi-input-bg, rgba(255, 255, 255, 0.05));
      box-shadow: 0 0 0 1px var(--bi-border-color, #374151) inset;
    }
    .el-input__inner {
      color: var(--bi-text-primary, #f3f4f6);
      font-size: 13px;
    }
  }
}

.preview-error {
  position: absolute;
  inset: 48px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bi-bg, #111827);
  z-index: 5;
}

.pure-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(31, 41, 55, 0.85);
  border: 1px solid var(--bi-border-color, #374151);
  border-radius: 16px;
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
  z-index: 20;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

// ========== 过渡动画 ==========
.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.toolbar-slide-enter-from,
.toolbar-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

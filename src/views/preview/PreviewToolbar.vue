<template>
  <div class="preview-header">
    <el-button text @click="emit('back')">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回</span>
    </el-button>
    <span class="preview-title">{{ dashboardName }}</span>
    <span class="preview-spacer"></span>
    <span v-if="lastRefreshAt" class="refresh-time">
      <el-icon><Clock /></el-icon>
      {{ formatTime(lastRefreshAt) }}
    </span>
    <el-tooltip content="手动刷新 (R)" placement="bottom">
      <el-button text :loading="refreshing" @click="emit('refresh')">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip :content="pureMode ? '显示工具栏 (H)' : '纯净模式 (H)'" placement="bottom">
      <el-button text @click="emit('toggle-pure')">
        <el-icon><component :is="pureMode ? Menu : Hide" /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip :content="isFullscreen ? '退出全屏 (F/Esc)' : '全屏 (F)'" placement="bottom">
      <el-button text @click="emit('toggle-fullscreen')">
        <el-icon><component :is="isFullscreen ? CloseBold : FullScreen" /></el-icon>
      </el-button>
    </el-tooltip>
    <el-divider direction="vertical" />
    <el-select
      :model-value="autoRefreshInterval"
      size="small"
      style="width: 110px"
      placeholder="自动刷新"
      @update:model-value="(v: number) => emit('update:autoRefreshInterval', v)"
      @change="emit('reset-auto-refresh')"
    >
      <el-option label="关闭" :value="0" />
      <el-option label="30 秒" :value="30" />
      <el-option label="1 分钟" :value="60" />
      <el-option label="5 分钟" :value="300" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Clock,
  CloseBold,
  FullScreen,
  Hide,
  Menu,
  Refresh,
} from '@element-plus/icons-vue'
import { formatTime } from './preview-utils'

defineProps<{
  dashboardName: string
  lastRefreshAt: Date | null
  refreshing: boolean
  pureMode: boolean
  isFullscreen: boolean
  autoRefreshInterval: number
}>()

const emit = defineEmits<{
  'update:autoRefreshInterval': [value: number]
  back: []
  refresh: []
  'toggle-pure': []
  'toggle-fullscreen': []
  'reset-auto-refresh': []
}>()
</script>

<style scoped lang="less">
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

/* ========== 移动端适配：工具栏紧凑, 隐藏次要控件 ========== */
@media (max-width: 768px) {
  .preview-header {
    height: 44px;
    padding: 0 8px;
    gap: 2px;
  }

  .preview-title {
    margin-left: 2px;
    font-size: 13px;
    max-width: 32vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .refresh-time,
  :deep(.el-divider--vertical),
  :deep(.el-select) {
    display: none;
  }

  :deep(.el-button.is-text) {
    padding: 4px 6px;
  }
}
</style>

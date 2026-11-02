<template>
  <div
    ref="previewRootRef"
    v-loading="loading"
    class="preview-page"
    :class="{ 'pure-mode': pureMode, 'fullscreen-mode': isFullscreen }"
    @mousemove="handleMouseMove"
    @mouseleave="hideToolbar"
  >
    <!-- 🔑 企业级数据大屏渲染层：铺满整个视口，scale 自适应 -->
    <DashboardScreen v-if="!loading && !loadError" />

    <!-- 浮动工具栏：hover 显示，不占用画布空间 -->
    <transition name="toolbar-slide">
      <PreviewToolbar
        v-show="showToolbar"
        :dashboard-name="store.dashboardName"
        :last-refresh-at="lastRefreshAt"
        :refreshing="refreshing"
        :pure-mode="pureMode"
        :is-fullscreen="isFullscreen"
        :auto-refresh-interval="autoRefreshInterval"
        @update:auto-refresh-interval="autoRefreshInterval = $event"
        @back="handleBack"
        @refresh="handleRefresh()"
        @toggle-pure="togglePureMode"
        @toggle-fullscreen="toggleFullscreen"
        @reset-auto-refresh="resetAutoRefresh"
      />
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
import { ref } from 'vue'
import { Menu } from '@element-plus/icons-vue'
import DashboardScreen from './components/DashboardScreen.vue'
import PreviewToolbar from './components/PreviewToolbar.vue'
import { usePreviewSession } from './composables/usePreviewSession'
import { usePreviewToolbar } from './composables/usePreviewToolbar'
import { generateTemplateThumbnail } from './composables/useTemplateThumbnail'

const previewRootRef = ref<HTMLElement | null>(null)

const { store, loading, loadError, refreshing, lastRefreshAt, handleRefresh, handleBack } =
  usePreviewSession({ onTemplateLoaded: generateTemplateThumbnail })

const {
  showToolbar,
  pureMode,
  isFullscreen,
  autoRefreshInterval,
  handleMouseMove,
  hideToolbar,
  toggleFullscreen,
  togglePureMode,
  resetAutoRefresh,
} = usePreviewToolbar({ rootRef: previewRootRef, onRefresh: handleRefresh })
</script>

<style scoped lang="less">
@import './styles/preview.less';
</style>

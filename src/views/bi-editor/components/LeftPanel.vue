<template>
  <div class="left-panel-wrapper" :class="{ collapsed }">
    <div class="left-panel">
      <!-- 组件库 / 图层 -->
      <el-tabs v-model="activeTab" class="panel-tabs">
        <el-tab-pane label="组件库" name="components">
          <ComponentLibraryTab
            :collapsed="collapsed"
            @drag-start="forwardDragStart"
            @add-component="forwardAddComponent"
          />
        </el-tab-pane>
        <el-tab-pane label="图层" name="layers">
          <LayerListTab />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 折叠拉手（侧边栏展开/收起按钮） -->
    <button
      class="sidebar-handle"
      :class="{ collapsed }"
      :title="collapsed ? '展开组件/图层面板' : '收起组件/图层面板'"
      @click="toggleCollapsed"
    >
      <el-icon class="handle-icon">
        <component :is="collapsed ? Right : Left" />
      </el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ComponentMeta } from '@/views/bi-editor/types'
import { ArrowLeft as Left, ArrowRight as Right } from '@element-plus/icons-vue'
import ComponentLibraryTab from './left-panel/ComponentLibraryTab.vue'
import LayerListTab from './left-panel/LayerListTab.vue'

const emit = defineEmits<{
  (e: 'drag-start', event: DragEvent, meta: ComponentMeta): void
  (e: 'add-component', meta: ComponentMeta): void
}>()

const activeTab = ref('components')

/** 侧边栏整体是否收起 */
const collapsed = ref(false)
function toggleCollapsed() {
  collapsed.value = !collapsed.value
}

/** 转发组件库子组件事件（保持对外 emit 契约不变） */
function forwardDragStart(event: DragEvent, meta: ComponentMeta) {
  emit('drag-start', event, meta)
}
function forwardAddComponent(meta: ComponentMeta) {
  emit('add-component', meta)
}
</script>

<style scoped lang="less">
.left-panel-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-shrink: 0;
  transition: width 0.25s ease;
}

.left-panel {
  width: 240px;
  height: 100%;
  background: var(--bi-panel-bg, #1f2937);
  border-right: 1px solid var(--bi-border-color, #374151);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition:
    width 0.25s ease,
    opacity 0.2s ease;
}

.left-panel-wrapper.collapsed .left-panel {
  width: 0;
  opacity: 0;
  pointer-events: none;
  border-right: none;
}

/* ===== 折叠拉手（贴在侧边栏右侧边缘） ===== */
.sidebar-handle {
  position: absolute;
  top: 50%;
  right: -11px; /* 一半露在 wrapper 外，方便点击 */
  transform: translateY(-50%);
  width: 22px;
  height: 64px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bi-border-color, #374151);
  border-left: none;
  background: linear-gradient(90deg, var(--bi-panel-bg, #1f2937), #253142);
  cursor: pointer;
  border-radius: 0 6px 6px 0;
  z-index: 10;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.25);
  color: var(--bi-text-secondary, #d1d5db);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(90deg, #2a3749, #37445b);
    color: var(--bi-accent, #409eff);
  }

  &.collapsed {
    right: -11px;
    border-left: 1px solid var(--bi-border-color, #374151);
    border-right: 1px solid var(--bi-border-color, #374151);
    background: linear-gradient(90deg, #253142, var(--bi-panel-bg, #1f2937));
    border-radius: 6px;
  }
}

.handle-icon {
  font-size: 14px;
}

.panel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 🔑 子元素使用 overflow 滚动时，父 flex item 必须限制最小高度 */
}

:deep(.el-tabs__nav-wrap) {
  padding-left: 20px;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: var(--bi-panel-header-bg, #111827);
  flex-shrink: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

:deep(.el-tabs__item) {
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 13px;
}

:deep(.el-tabs__item.is-active) {
  color: var(--bi-accent, #409eff);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--bi-accent, #409eff);
}

:deep(.el-tabs__content) {
  flex: 1;
  min-height: 0; /* 🔑 允许内部容器真正溢出并产生滚动 */
  overflow-y: auto;
  padding: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--bi-scrollbar-thumb, #4b5563) var(--bi-scrollbar-track, #1f2937);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: var(--bi-scrollbar-track, #1f2937);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--bi-scrollbar-thumb, #4b5563);
    border-radius: 3px;

    &:hover {
      background: var(--bi-scrollbar-thumb-hover, #6b7280);
    }
  }
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style>

<template>
  <div class="right-panel-wrapper" :class="{ collapsed }">
    <!-- 折叠拉手（放在右面板的左边缘，点击展开/收起） -->
    <button
      class="sidebar-handle"
      :class="{ collapsed }"
      :title="collapsed ? '展开属性/样式/数据面板' : '收起属性/样式/数据面板'"
      @click="toggleCollapsed"
    >
      <el-icon class="handle-icon">
        <component :is="collapsed ? Left : Right" />
      </el-icon>
    </button>

    <div class="right-panel">
      <el-tabs v-model="activeTab" class="panel-tabs">
        <!-- 属性面板：单组件属性 / 多选批量 / 空状态 -->
        <el-tab-pane label="属性" name="props">
          <PropsTab />
        </el-tab-pane>

        <!-- 样式面板 -->
        <el-tab-pane label="样式" name="style">
          <StyleTab />
        </el-tab-pane>

        <!-- 数据面板（已拆分为独立组件） -->
        <el-tab-pane label="数据" name="data">
          <DataBindingPanel />
        </el-tab-pane>

        <!-- 🔑 画布全局设置：背景/尺寸/网格/标尺 -->
        <el-tab-pane label="画布" name="canvas">
          <CanvasTab />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft as Left, ArrowRight as Right } from '@element-plus/icons-vue'
import DataBindingPanel from './DataBindingPanel.vue'
import PropsTab from './right-panel/PropsTab.vue'
import StyleTab from './right-panel/StyleTab.vue'
import CanvasTab from './right-panel/CanvasTab.vue'

const activeTab = ref('props')

/** 侧边栏整体是否收起 */
const collapsed = ref(false)
function toggleCollapsed() {
  collapsed.value = !collapsed.value
}
</script>

<style scoped lang="less">
.right-panel-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-shrink: 0;
  transition: width 0.25s ease;
}

.right-panel {
  width: 300px;
  height: 100%;
  background: var(--bi-panel-bg, #1f2937);
  border-left: 1px solid var(--bi-border-color, #374151);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition:
    width 0.25s ease,
    opacity 0.25s ease;
}

.right-panel-wrapper.collapsed .right-panel {
  width: 0;
  opacity: 0;
  pointer-events: none;
  border-left: none;
}

/* ===== 折叠拉手（贴在侧边栏的左边缘） ===== */
.sidebar-handle {
  position: absolute;
  top: 50%;
  left: -11px; /* 一半露在 wrapper 外，方便点击 */
  transform: translateY(-50%);
  width: 22px;
  height: 64px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bi-border-color, #374151);
  border-right: none;
  background: linear-gradient(270deg, var(--bi-panel-bg, #1f2937), #253142);
  cursor: pointer;
  border-radius: 6px 0 0 6px;
  z-index: 10;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.25);
  color: var(--bi-text-secondary, #d1d5db);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(270deg, #2a3749, #37445b);
    color: var(--bi-accent, #409eff);
  }

  &.collapsed {
    left: -11px;
    border-left: 1px solid var(--bi-border-color, #374151);
    border-right: 1px solid var(--bi-border-color, #374151);
    background: linear-gradient(270deg, var(--bi-panel-bg, #1f2937), #253142);
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
  min-height: 0; /* 🔑 允许子元素真正溢出并触发滚动 */
}

:deep(.el-tabs__nav-wrap) {
  padding-left: 20px;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: var(--bi-panel-header-bg, #111827);
  flex-shrink: 0; /* 🔑 防止 tab header 被压缩 */
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
  min-height: 0; /* 🔑 flex 容器内产生滚动的关键 */
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: var(--bi-scrollbar-thumb, #4b5563) var(--bi-scrollbar-track, #1f2937);
}

:deep(.el-tab-pane) {
  height: 100%;
}

:deep(.el-tabs__content::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-tabs__content::-webkit-scrollbar-track) {
  background: var(--bi-scrollbar-track, #1f2937);
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb) {
  background: var(--bi-scrollbar-thumb, #4b5563);
  border-radius: 3px;
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb:hover) {
  background: var(--bi-scrollbar-thumb-hover, #6b7280);
}
</style>

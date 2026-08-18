<template>
  <div class="left-panel-wrapper" :class="{ collapsed }">
    <div class="left-panel">
      <!-- 组件库 -->
      <el-tabs v-model="activeTab" class="panel-tabs">
        <el-tab-pane label="组件库" name="components">
          <div class="component-library">
            <!-- 按分类的折叠面板：每个 CATEGORY_LABEL 作为一个 el-collapse-item，点击可展开/收起 -->
            <el-collapse v-model="activeCollapseGroups">
              <el-collapse-item
                v-for="(catLabel, catKey) in CATEGORY_LABELS"
                :key="catKey"
                :name="catKey"
                v-show="filteredComponents(catKey as any).length > 0"
              >
                <template #title>
                  <span class="collapse-title">{{ catLabel }}</span>
                </template>
                <div class="component-grid">
                  <div
                    v-for="compMeta in filteredComponents(catKey as any)"
                    :key="compMeta.type"
                    class="component-item"
                    draggable="true"
                    @mouseenter="preloadComponent(compMeta.type)"
                    @dragstart="handleDragStart($event, compMeta)"
                    @click="handleAddComponent(compMeta)"
                  >
                    <div class="component-preview">
                      <div
                        class="component-preview__inner"
                        :style="
                          previewScaleStyle(compMeta.defaultWidth, compMeta.defaultHeight, 96, 60)
                        "
                      >
                        <ComponentRenderer :component="makePreviewInstance(compMeta)" />
                      </div>
                    </div>
                    <span class="component-name">{{ compMeta.name }}</span>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>

        <!-- 图层 -->
        <el-tab-pane label="图层" name="layers">
          <div class="layer-list">
            <div
              v-for="layer in store.layerList"
              :key="layer.id"
              class="layer-item"
              :class="{ active: layer.id === store.selectedId }"
              @click="store.selectComponent(layer.id)"
            >
              <div class="layer-thumb">
                <div
                  class="layer-thumb__inner"
                  :style="previewScaleStyle(layer.width, layer.height, 34, 26)"
                >
                  <ComponentRenderer :component="layer" />
                </div>
              </div>
              <div class="layer-info">
                <span class="layer-name" :class="{ hidden: !layer.visible }">
                  {{ layer.name }}
                </span>
              </div>
              <div class="layer-actions">
                <el-tooltip :content="layer.visible ? '隐藏' : '显示'" placement="top">
                  <el-icon
                    :size="16"
                    class="action-btn"
                    :class="{ active: layer.visible }"
                    @click.stop="store.toggleVisibility(layer.id)"
                    ><component :is="layer.visible ? View : Hide"
                  /></el-icon>
                </el-tooltip>
                <el-tooltip :content="layer.locked ? '解锁' : '锁定'" placement="top">
                  <el-icon
                    :size="16"
                    class="action-btn"
                    :class="{ active: layer.locked }"
                    @click.stop="store.toggleLock(layer.id)"
                    ><component :is="layer.locked ? Lock : Unlock"
                  /></el-icon>
                </el-tooltip>
              </div>
            </div>

            <el-empty
              v-if="store.components.length === 0"
              description="暂无图层，请添加组件"
              :image-size="80"
            />
          </div>
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
import { ref, markRaw, watch } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  getDefaultProps,
  getDefinition,
} from '@/views/bi-editor/component-defs'
import { COMPONENT_META, getMeta } from '@/stores/bi-editor/metadata'
import type { ComponentMeta, ComponentCategory, ComponentInstance } from '@/views/bi-editor/types'
import ComponentRenderer from './ComponentRenderer.vue'
import { preloadComponent } from '@/views/bi-editor/component-defs/registry'
import {
  Document,
  Picture,
  FullScreen,
  Minus,
  DataLine,
  TrendCharts,
  PieChart,
  Grid,
  Odometer,
  Loading,
  Flag,
  View,
  Hide,
  Lock,
  Unlock,
  ArrowRight as Left,
  ArrowLeft as Right,
} from '@element-plus/icons-vue'
import type { Component as VComponent } from 'vue'

// icon 字符串 → 图标组件对象的映射（图层缩略图失败时可能不会用到，但保留兼容）
const ICON_MAP: ReadonlyMap<string, VComponent> = new Map([
  ['Document', markRaw(Document)],
  ['Picture', markRaw(Picture)],
  ['FullScreen', markRaw(FullScreen)],
  ['Minus', markRaw(Minus)],
  ['DataLine', markRaw(DataLine)],
  ['TrendCharts', markRaw(TrendCharts)],
  ['PieChart', markRaw(PieChart)],
  ['Grid', markRaw(Grid)],
  ['Odometer', markRaw(Odometer)],
  ['Loading', markRaw(Loading)],
  ['Flag', markRaw(Flag)],
])

function resolveIcon(name?: string): VComponent {
  if (!name) return Document
  return (ICON_MAP.get(name) as VComponent) ?? Document
}

const emit = defineEmits<{
  (e: 'drag-start', event: DragEvent, meta: ComponentMeta): void
  (e: 'add-component', meta: ComponentMeta): void
}>()

const store = useBiEditorStore()
const activeTab = ref('components')

/** 侧边栏整体是否收起 */
const collapsed = ref(false)
function toggleCollapsed() {
  collapsed.value = !collapsed.value
}

/** 组件库折叠面板：默认所有分类都展开 */
const activeCollapseGroups = ref<ComponentCategory[]>(Object.keys(CATEGORY_LABELS) as any)
/** 切换 collapsed 时：收起后就把所有折叠面板关闭，展开时恢复 */
watch(collapsed, (v) => {
  if (v) {
    activeCollapseGroups.value = []
  } else {
    activeCollapseGroups.value = Object.keys(CATEGORY_LABELS) as any
  }
})

/** 把 ComponentMeta（元信息）构造成一个最小化的 ComponentInstance 供 ComponentRenderer 预览使用 */
function makePreviewInstance(meta: ComponentMeta): ComponentInstance {
  return {
    id: `preview-${meta.type}`,
    type: meta.type,
    name: meta.name,
    x: 0,
    y: 0,
    width: meta.defaultWidth,
    height: meta.defaultHeight,
    zIndex: 0,
    visible: true,
    locked: false,
    props: meta.defaultProps ?? getDefaultProps(meta.type),
    style: meta.defaultStyle ?? {},
    dataSource: { datasetId: null },
    dataConfig: {},
  }
}

/**
 * 🔑 计算预览内层 wrapper 的居中缩放样式：
 *   - 外层 position: relative + overflow: hidden + 固定尺寸视口
 *   - 内层 position: absolute; left:50%; top:50%;
 *   - transform: translate(-50%,-50%) scale(x)  —— 先按自身尺寸平移居中，再从中心整体缩放
 *   - transform-origin: center center
 *   ✅ 这种方式无论 scale 多少，视觉中心永远精确落在父容器中心，不会偏移裁切
 */
function previewScaleStyle(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
): Record<string, string> {
  const w = Math.max(1, srcW || 1)
  const h = Math.max(1, srcH || 1)
  const scale = Math.min(maxW / w, maxH / h, 1)
  return {
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(-50%, -50%) scale(${scale})`,
    transformOrigin: 'center center',
  }
}

/** 按分类筛选组件：直接复用 component-defs 的 CATEGORY_GROUPS */
function filteredComponents(category: ComponentCategory): ComponentMeta[] {
  const defs = CATEGORY_GROUPS[category] ?? []
  return defs.map((d) => ({
    type: d.type,
    name: d.meta.name,
    category: d.meta.category,
    icon: d.meta.icon,
    defaultWidth: d.meta.defaultWidth,
    defaultHeight: d.meta.defaultHeight,
    defaultProps: getDefaultProps(d.type),
    defaultStyle: d.defaultStyle || {},
  }))
}

function handleDragStart(event: DragEvent, meta: ComponentMeta) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(meta))
    event.dataTransfer.effectAllowed = 'copy'
  }
  emit('drag-start', event, meta)
}

function handleAddComponent(meta: ComponentMeta) {
  emit('add-component', meta)
}

function getLayerIcon(type: string): VComponent {
  return resolveIcon(getMeta(type as any)?.icon)
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
}

:deep(.el-tab-pane) {
  height: 100%;
}

/* ===== 组件库 ===== */
.component-library {
  width: 100%; /* 🔑 限制宽度，禁止超过 el-tabs__content */
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
}

/* 🔑 让 el-collapse 项的 header 与原 group-title 视觉一致 */
.component-library :deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
  background: transparent;
}

.component-library :deep(.el-collapse-item) {
  border-bottom: 1px solid var(--bi-border-color, #374151);
  background: transparent;
  margin-bottom: 4px;
}

.component-library :deep(.el-collapse-item__header) {
  height: 28px;
  line-height: 28px;
  padding: 0 2px;
  background: transparent;
  border-bottom: none;
  color: var(--bi-text-muted, #6b7280);
  font-weight: 600;
}

.component-library :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background: transparent;
  will-change: auto;
}

.component-library :deep(.el-collapse-item__content) {
  padding: 4px 0 12px;
  background: transparent;
  color: inherit;
}

.collapse-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: inherit;
}

.component-group {
  width: 100%; /* 🔑 按父容器宽度铺开 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
}

.group-title {
  font-size: 11px;
  color: var(--bi-text-muted, #6b7280);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 0 2px;
}

.component-grid {
  width: 100%; /* 🔑 grid 容器按父宽度铺开 */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); /* 🔑 minmax(0,1fr) 防止子项内容撑爆 grid 列 */
  gap: 8px;
  box-sizing: border-box;
}

.component-item {
  width: 100%; /* 🔑 每个卡片填满 grid 列 */
  min-width: 0; /* 🔑 允许 flex 子项收缩到小于内容宽度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 10px 6px 8px;
  background: var(--bi-component-bg, #374151);
  border: 1px solid var(--bi-component-border, #4b5563);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
  box-sizing: border-box;
  overflow: hidden;

  &:hover {
    background: var(--bi-component-hover-bg, #4b5563);
    border-color: var(--bi-accent, #409eff);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  }

  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
}

/* 🔑 组件预览容器：固定视口尺寸，溢出隐藏；内层绝对定位，scale 后不影响布局宽度 */
.component-preview {
  width: 100%;
  height: 72px;
  background: #fff;
  border-radius: 6px;
  position: relative; /* 为内层 absolute 提供定位原点 */
  overflow: hidden;
  flex-shrink: 0; /* 🔑 禁止被压缩，保证预览框尺寸稳定 */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;

  &__inner {
    /* 🔑 脱离文档流，scale 尺寸不参与外层布局计算，不再撑爆父容器 */
    position: absolute;
    left: 50%;
    top: 50%;
    /* 注意：transform 实际值由 previewScaleStyle 内联样式传入 translate + scale */
    transform-origin: center center;
    will-change: transform;
    pointer-events: none; /* 预览区不响应鼠标事件，避免影响外层拖拽/点击 */
  }
}

.component-name {
  font-size: 12px;
  color: var(--bi-text-secondary, #d1d5db);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0 2px;
}

/* ===== 图层列表 ===== */
.layer-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 100%;
  box-sizing: border-box;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--bi-layer-bg, #374151);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bi-layer-hover-bg, #4b5563);
  }

  &.active {
    background: var(--bi-layer-active-bg, rgba(30, 64, 175, 0.55));
    border-color: var(--bi-accent, #409eff);
  }
}

/* 🔑 图层缩略图：固定 40x32 视口，内层 absolute 脱离文档流，避免 scale 后撑大外层 */
.layer-thumb {
  width: 40px;
  height: 32px;
  background: #ffffff;
  border-radius: 4px;
  flex-shrink: 0; /* 🔑 禁止 flex item 压缩缩略图 */
  overflow: hidden;
  position: relative; /* 为内层 absolute 提供定位原点 */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;

  &__inner {
    /* 🔑 脱离文档流，scale 尺寸不影响外层布局 */
    position: absolute;
    left: 50%;
    top: 50%;
    transform-origin: 0 0;
    will-change: transform;
    pointer-events: none;
  }
}

.layer-info {
  flex: 1;
  min-width: 0; /* 🔑 允许 flex 子项收缩，文本省略正常工作 */
  display: flex;
  align-items: center;
}

.layer-name {
  font-size: 13px;
  color: var(--bi-text-primary, #f3f4f6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.layer-name.hidden {
  text-decoration: line-through;
  opacity: 0.5;
}

.layer-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  padding: 3px;
  border-radius: 3px;
  color: var(--bi-icon-color, #d1d5db);
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  &.active {
    color: var(--bi-accent, #60a5fa);
  }
}

/* ===== 统一滚动条样式 ===== */
:deep(.el-tabs__content),
:deep(.component-library),
:deep(.layer-list) {
  scrollbar-width: thin;
  scrollbar-color: var(--bi-scrollbar-thumb, #4b5563) var(--bi-scrollbar-track, #1f2937);
}

:deep(.el-tabs__content::-webkit-scrollbar),
:deep(.component-library::-webkit-scrollbar),
:deep(.layer-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-tabs__content::-webkit-scrollbar-track),
:deep(.component-library::-webkit-scrollbar-track),
:deep(.layer-list::-webkit-scrollbar-track) {
  background: var(--bi-scrollbar-track, #1f2937);
  border-radius: 3px;
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb),
:deep(.component-library::-webkit-scrollbar-thumb),
:deep(.layer-list::-webkit-scrollbar-thumb) {
  background: var(--bi-scrollbar-thumb, #4b5563);
  border-radius: 3px;

  &:hover {
    background: var(--bi-scrollbar-thumb-hover, #6b7280);
  }
}
</style>

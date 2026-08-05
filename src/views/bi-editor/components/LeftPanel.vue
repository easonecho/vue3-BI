<template>
  <div class="left-panel">
    <!-- 组件库 -->
    <el-tabs v-model="activeTab" class="panel-tabs">
      <el-tab-pane label="组件库" name="components">
        <div class="component-library">
          <!-- 组件分组：动态读取 metadata.ts 的 CATEGORY_GROUPS / CATEGORY_LABELS，单份配置 -->
          <template v-for="(catLabel, catKey) in CATEGORY_LABELS" :key="catKey">
            <div class="component-group" v-if="filteredComponents(catKey as any).length > 0">
              <div class="group-title">{{ catLabel }}</div>
              <div class="component-grid">
                <div
                  v-for="comp in filteredComponents(catKey as any)"
                  :key="comp.type"
                  class="component-item"
                  draggable="true"
                  @dragstart="handleDragStart($event, comp)"
                  @click="handleAddComponent(comp)"
                >
                  <el-icon :size="20" class="component-icon"
                    ><component :is="resolveIcon(comp.icon)"
                  /></el-icon>
                  <span class="component-name">{{ comp.name }}</span>
                </div>
              </div>
            </div>
          </template>
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
            <div class="layer-info">
              <el-icon :size="16" color="#f3f4f6">
                <component :is="getLayerIcon(layer.type)" />
              </el-icon>
              <span class="layer-name" :class="{ hidden: !layer.visible }">
                {{ layer.name }}
              </span>
            </div>
            <div class="layer-actions">
              <el-tooltip :content="layer.visible ? '隐藏' : '显示'" placement="top">
                <el-icon :size="16" @click.stop="store.toggleVisibility(layer.id)"
                  ><component :is="layer.visible ? View : Hide"
                /></el-icon>
              </el-tooltip>
              <el-tooltip :content="layer.locked ? '解锁' : '锁定'" placement="top">
                <el-icon :size="16" @click.stop="store.toggleLock(layer.id)">
                  <component :is="layer.locked ? Lock : Unlock"
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
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
// 🔑 统一使用 stores/bi-editor/metadata.ts 作为唯一元数据源，
// 避免 LeftPanel.vue 本地再维护一份 componentMetas 导致 defaultWidth/defaultHeight 不一致。
// 任何对组件默认尺寸、图标、分类的修改，只需要改 metadata.ts 一处即可全局生效。
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  COMPONENT_META,
  getMeta,
} from '@/stores/bi-editor/metadata'
import type { ComponentMeta, ComponentCategory } from '@/views/bi-editor/types'
// Element Plus Icons：必须显式导入组件对象后，模板里的 <component :is="..." /> 才能正确渲染；
// ❌ 直接传字符串（如 'Eye'/'Document'）给 :is 不会被解析为已导入的图标组件。
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
} from '@element-plus/icons-vue'
import type { Component as VComponent } from 'vue'

// icon 字符串 → 图标组件对象的映射；未命中时 fallback 到 Document（确认存在）
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

/** 把 metadata.icon 的字符串名解析成真实的 Element Plus 图标组件对象，找不到则用 Document 兜底 */
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

/** 按分类筛选组件：直接复用 metadata.ts 预计算好的 CATEGORY_GROUPS（按 COMPONENT_META 查表生成，绝对同步） */
function filteredComponents(category: ComponentCategory) {
  return CATEGORY_GROUPS[category] ?? []
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
  // 🔑 直接从 COMPONENT_META 查表读取 icon（字符串），再通过 resolveIcon 转成组件对象；
  // 未来新增组件类型或修改图标时只需要改 metadata.ts 一处。
  return resolveIcon(getMeta(type as any)?.icon)
}
</script>

<style scoped lang="less">
.left-panel {
  width: 240px;
  height: 100%;
  background: var(--bi-panel-bg, #1f2937);
  border-right: 1px solid var(--bi-border-color, #374151);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: var(--bi-panel-header-bg, #111827);
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
  overflow-y: auto;
}

.component-library {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.component-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  font-size: 12px;
  color: var(--bi-text-muted, #6b7280);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--bi-component-bg, #374151);
  border: 1px solid var(--bi-component-border, #4b5563);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
}

.component-item:hover {
  background: var(--bi-component-hover-bg, #4b5563);
  border-color: var(--bi-accent, #409eff);
  transform: translateY(-1px);
}

.component-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.component-icon {
  color: var(--bi-text-primary, #f3f4f6);
}

.component-name {
  font-size: 12px;
  color: var(--bi-text-secondary, #d1d5db);
}

/* 图层列表 */
.layer-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--bi-layer-bg, #374151);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.layer-item:hover {
  background: var(--bi-layer-hover-bg, #4b5563);
}

.layer-item.active {
  background: var(--bi-layer-active-bg, #1e40af);
  border: 1px solid var(--bi-accent, #409eff);
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.layer-name {
  font-size: 13px;
  color: var(--bi-text-primary, #f3f4f6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-name.hidden {
  text-decoration: line-through;
}

.layer-actions {
  display: flex;
  gap: 8px;
}

:deep(.layer-actions .el-icon) {
  color: var(--bi-icon-color, #ffffff);
}

/* 滚动条样式 */
:deep(.el-tabs__content::-webkit-scrollbar),
:deep(.component-library::-webkit-scrollbar),
:deep(.layer-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-tabs__content::-webkit-scrollbar-track),
:deep(.component-library::-webkit-scrollbar-track),
:deep(.layer-list::-webkit-scrollbar-track) {
  background: var(--bi-scrollbar-track, #1f2937);
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb),
:deep(.component-library::-webkit-scrollbar-thumb),
:deep(.layer-list::-webkit-scrollbar-thumb) {
  background: var(--bi-scrollbar-thumb, #4b5563);
  border-radius: 3px;
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb:hover),
:deep(.component-library::-webkit-scrollbar-thumb:hover),
:deep(.layer-list::-webkit-scrollbar-thumb:hover) {
  background: var(--bi-scrollbar-thumb-hover, #6b7280);
}
</style>

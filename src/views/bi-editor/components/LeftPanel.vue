<template>
  <div class="left-panel">
    <!-- 组件库 -->
    <el-tabs v-model="activeTab" class="panel-tabs">
      <el-tab-pane label="组件库" name="components">
        <div class="component-library">
          <!-- 基础组件 -->
          <div class="component-group">
            <div class="group-title">基础组件</div>
            <div class="component-grid">
              <div
                v-for="comp in filteredComponents('basic')"
                :key="comp.type"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, comp)"
                @click="handleAddComponent(comp)"
              >
                <el-icon :size="20" class="component-icon"><component :is="comp.icon" /></el-icon>
                <span class="component-name">{{ comp.name }}</span>
              </div>
            </div>
          </div>

          <!-- 图表组件 -->
          <div class="component-group">
            <div class="group-title">图表组件</div>
            <div class="component-grid">
              <div
                v-for="comp in filteredComponents('chart')"
                :key="comp.type"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, comp)"
                @click="handleAddComponent(comp)"
              >
                <el-icon :size="20" class="component-icon"><component :is="comp.icon" /></el-icon>
                <span class="component-name">{{ comp.name }}</span>
              </div>
            </div>
          </div>

          <!-- 数据组件 -->
          <div class="component-group">
            <div class="group-title">数据组件</div>
            <div class="component-grid">
              <div
                v-for="comp in filteredComponents('data')"
                :key="comp.type"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, comp)"
                @click="handleAddComponent(comp)"
              >
                <el-icon :size="20" class="component-icon"><component :is="comp.icon" /></el-icon>
                <span class="component-name">{{ comp.name }}</span>
              </div>
            </div>
          </div>

          <!-- 信息组件 -->
          <div class="component-group">
            <div class="group-title">信息组件</div>
            <div class="component-grid">
              <div
                v-for="comp in filteredComponents('info')"
                :key="comp.type"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, comp)"
                @click="handleAddComponent(comp)"
              >
                <el-icon :size="20" class="component-icon"><component :is="comp.icon" /></el-icon>
                <span class="component-name">{{ comp.name }}</span>
              </div>
            </div>
          </div>
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
              <el-icon
                :size="16"
                :color="layer.visible ? '#f3f4f6' : '#6b7280'"
              >
                <component :is="getLayerIcon(layer.type)" />
              </el-icon>
              <span class="layer-name" :class="{ hidden: !layer.visible }">
                {{ layer.name }}
              </span>
            </div>
            <div class="layer-actions">
              <el-tooltip :content="layer.visible ? '隐藏' : '显示'" placement="top">
                <el-button size="small" text @click.stop="store.toggleVisibility(layer.id)">
                  <el-icon><component :is="layer.visible ? 'Eye' : 'Hide'" /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip :content="layer.locked ? '解锁' : '锁定'" placement="top">
                <el-button size="small" text @click.stop="store.toggleLock(layer.id)">
                  <el-icon><component :is="layer.locked ? 'Lock' : 'Unlock'" /></el-icon>
                </el-button>
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
import { ref } from 'vue'
import { useBiEditorStore } from '@/stores/biEditor'
import type { ComponentMeta, ComponentCategory } from '@/views/bi-editor/types'

const emit = defineEmits<{
  (e: 'drag-start', event: DragEvent, meta: ComponentMeta): void
  (e: 'add-component', meta: ComponentMeta): void
}>()

const store = useBiEditorStore()

const activeTab = ref('components')

/** 组件元数据列表 */
const componentMetas: ComponentMeta[] = [
  { type: 'text', name: '文本', category: 'basic', icon: 'Document', defaultWidth: 120, defaultHeight: 40, defaultProps: { text: '文本内容', fontSize: 14 }, defaultStyle: {} },
  { type: 'image', name: '图片', category: 'basic', icon: 'Picture', defaultWidth: 160, defaultHeight: 120, defaultProps: { src: '' }, defaultStyle: {} },
  { type: 'rect', name: '矩形', category: 'basic', icon: 'FullScreen', defaultWidth: 100, defaultHeight: 80, defaultProps: { borderRadius: 0 }, defaultStyle: {} },
  { type: 'line', name: '直线', category: 'basic', icon: 'Minus', defaultWidth: 200, defaultHeight: 2, defaultProps: { direction: 'horizontal' }, defaultStyle: {} },
  { type: 'bar-chart', name: '柱状图', category: 'chart', icon: 'DataLine', defaultWidth: 400, defaultHeight: 300, defaultProps: { title: '柱状图' }, defaultStyle: {} },
  { type: 'line-chart', name: '折线图', category: 'chart', icon: 'TrendCharts', defaultWidth: 400, defaultHeight: 300, defaultProps: { title: '折线图' }, defaultStyle: {} },
  { type: 'pie-chart', name: '饼图', category: 'chart', icon: 'PieChart', defaultWidth: 300, defaultHeight: 300, defaultProps: { title: '饼图' }, defaultStyle: {} },
  { type: 'scatter-chart', name: '散点图', category: 'chart', icon: 'DataPoint', defaultWidth: 400, defaultHeight: 300, defaultProps: { title: '散点图' }, defaultStyle: {} },
  { type: 'table', name: '表格', category: 'data', icon: 'Grid', defaultWidth: 500, defaultHeight: 200, defaultProps: { columns: [], data: [] }, defaultStyle: {} },
  { type: 'number', name: '数字', category: 'info', icon: 'Odometer', defaultWidth: 100, defaultHeight: 60, defaultProps: { value: 0, fontSize: 24 }, defaultStyle: {} },
  { type: 'gauge', name: '仪表盘', category: 'info', icon: 'Odometer', defaultWidth: 200, defaultHeight: 200, defaultProps: { value: 50, max: 100 }, defaultStyle: {} },
  { type: 'progress', name: '进度条', category: 'info', icon: 'Loading', defaultWidth: 300, defaultHeight: 20, defaultProps: { value: 0, max: 100 }, defaultStyle: {} },
  { type: 'indicator', name: '指标卡', category: 'info', icon: 'Flag', defaultWidth: 200, defaultHeight: 100, defaultProps: { title: '指标', value: 0 }, defaultStyle: {} },
]

function filteredComponents(category: ComponentCategory) {
  return componentMetas.filter((c) => c.category === category)
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

function getLayerIcon(type: string): string {
  const iconMap: Record<string, string> = {
    text: 'Document',
    image: 'Picture',
    rect: 'FullScreen',
    line: 'Minus',
    'bar-chart': 'DataLine',
    'line-chart': 'TrendCharts',
    'pie-chart': 'PieChart',
    'scatter-chart': 'DataPoint',
    table: 'Grid',
    number: 'Odometer',
    gauge: 'Odometer',
    progress: 'Loading',
    indicator: 'Flag',
  }
  return iconMap[type] || 'Document'
}
</script>

<style scoped>
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
  color: var(--bi-text-muted, #6b7280);
  text-decoration: line-through;
}

.layer-actions {
  display: flex;
  gap: 2px;
}

:deep(.layer-actions .el-button) {
  padding: 4px;
}

:deep(.layer-actions .el-button .el-icon) {
  color: var(--bi-text-muted, #9ca3af);
}

:deep(.layer-actions .el-button:hover .el-icon) {
  color: var(--bi-text-primary, #f3f4f6);
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

<template>
  <div class="header-toolbar">
    <!-- Logo 区域 -->
    <div class="header-left">
      <div class="logo">
        <el-icon :size="24" color="#409EFF"><DataAnalysis /></el-icon>
        <span class="logo-text">BI 编辑器</span>
      </div>
      <el-divider direction="vertical" />
      <span class="file-name">未命名报表</span>
    </div>

    <!-- 操作按钮组 -->
    <div class="header-center">
      <el-button-group>
        <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
          <el-button :disabled="!store.canUndo()" @click="store.undo()">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="重做 (Ctrl+Shift+Z)" placement="bottom">
          <el-button :disabled="!store.canRedo()" @click="store.redo()">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <el-button-group>
        <el-tooltip content="复制 (Ctrl+D)" placement="bottom">
          <el-button :disabled="!store.selectedId" @click="handleDuplicate">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="删除 (Delete)" placement="bottom">
          <el-button :disabled="!store.selectedId" @click="handleDelete">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 视图控制 -->
      <el-button-group>
        <el-tooltip content="标尺" placement="bottom">
          <el-button
            :type="store.canvas.showRuler ? 'primary' : 'default'"
            @click="toggleRuler"
          >
            <el-icon><Ruler /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="网格" placement="bottom">
          <el-button
            :type="store.canvas.showGrid ? 'primary' : 'default'"
            @click="toggleGrid"
          >
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="网格吸附" placement="bottom">
          <el-button
            :type="store.canvas.snapToGrid ? 'primary' : 'default'"
            @click="toggleSnap"
          >
            <el-icon><Magnet /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="辅助线" placement="bottom">
          <el-button
            :type="store.canvas.showGuides ? 'primary' : 'default'"
            @click="toggleGuides"
          >
            <el-icon><Guide /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 缩放控制 -->
      <div class="zoom-control">
        <el-button size="small" @click="zoomOut">
          <el-icon><Minus /></el-icon>
        </el-button>
        <el-dropdown>
          <el-button size="small" class="zoom-display">
            {{ Math.round(store.canvas.zoom * 100) }}%
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="opt in zoomOptions"
                :key="opt.value"
                @click="store.setZoom(opt.value)"
              >
                {{ opt.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="zoomIn">
          <el-icon><Plus /></el-icon>
        </el-button>
        <el-button size="small" @click="resetZoom">
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 右侧操作 -->
    <div class="header-right">
      <el-button @click="handlePreview">
        <el-icon><View /></el-icon>
        <span>预览</span>
      </el-button>
      <el-button type="primary" @click="handleSave">
        <el-icon><FolderChecked /></el-icon>
        <span>保存</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBiEditorStore } from '@/stores/biEditor'
import { useCanvasZoom } from '@/views/bi-editor/composables/useCanvas'

const store = useBiEditorStore()
const { zoomOptions, zoomIn, zoomOut, resetZoom } = useCanvasZoom()

function toggleRuler() {
  store.updateCanvas({ showRuler: !store.canvas.showRuler })
}

function toggleGrid() {
  store.updateCanvas({ showGrid: !store.canvas.showGrid })
}

function toggleSnap() {
  store.updateCanvas({ snapToGrid: !store.canvas.snapToGrid })
}

function toggleGuides() {
  store.updateCanvas({ showGuides: !store.canvas.showGuides })
}

function handleDuplicate() {
  if (store.selectedId) {
    store.duplicateComponent(store.selectedId)
  }
}

function handleDelete() {
  if (store.selectedId) {
    store.removeComponent(store.selectedId)
  }
}

function handlePreview() {
  // TODO: 打开预览模式
  console.log('预览模式')
}

function handleSave() {
  // TODO: 保存画布数据
  console.log('保存数据', {
    canvas: store.canvas,
    components: store.components,
  })
}
</script>

<style scoped>
.header-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--bi-header-bg, #1f2937);
  border-bottom: 1px solid var(--bi-border-color, #374151);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--bi-text-primary, #f3f4f6);
}

.file-name {
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 14px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-display {
  min-width: 60px;
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-button) {
  background: var(--bi-btn-bg, #374151);
  border-color: var(--bi-btn-border, #4b5563);
  color: var(--bi-text-primary, #f3f4f6);
}

:deep(.el-button:hover) {
  background: var(--bi-btn-hover, #4b5563);
  border-color: var(--bi-btn-border, #6b7280);
}

:deep(.el-button.is-disabled) {
  background: var(--bi-btn-disabled, #374151);
}

:deep(.el-divider--vertical) {
  background-color: var(--bi-border-color, #4b5563);
}
</style>

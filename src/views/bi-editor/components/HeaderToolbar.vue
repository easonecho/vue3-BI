<template>
  <div class="header-toolbar">
    <!-- Logo 区域 -->
    <div class="header-left">
      <div class="logo">
        <el-icon :size="24" color="#409EFF"><DataAnalysis /></el-icon>
        <span class="logo-text">BI 编辑器</span>
      </div>
      <el-divider direction="vertical" />
      <el-input
        v-model="store.dashboardName"
        class="file-name-input"
        size="small"
        :placeholder="'未命名报表'"
      />
      <span v-if="store.isDirty" class="dirty-dot" title="有未保存的修改"></span>
    </div>

    <!-- 操作按钮组（中间） -->
    <div class="header-center">
      <!-- 历史：撤销 / 重做 -->
      <el-button-group>
        <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
          <el-button :disabled="!store.canUndo()" @click="store.undo()">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="重做 (Ctrl+Shift+Z / Ctrl+Y)" placement="bottom">
          <el-button :disabled="!store.canRedo()" @click="store.redo()">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 组件操作：复制 / 删除 / 全选 -->
      <el-button-group>
        <el-tooltip content="复制 (Ctrl+D)" placement="bottom">
          <el-button :disabled="!store.selectedId" @click="handleDuplicate">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="删除 (Delete / Backspace)" placement="bottom">
          <el-button :disabled="!store.selectedId" @click="handleDelete">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 图层顺序：置顶 / 上移一层 / 下移一层 / 置底 -->
      <el-button-group>
        <el-tooltip content="置顶" placement="bottom">
          <el-button :disabled="!store.canBringToFront" @click="handleBringToFront">
            <el-icon><Top /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="上移一层" placement="bottom">
          <el-button :disabled="!store.canMoveUp" @click="handleMoveUp">
            <el-icon><ArrowUp /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="下移一层" placement="bottom">
          <el-button :disabled="!store.canMoveDown" @click="handleMoveDown">
            <el-icon><ArrowDown /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="置底" placement="bottom">
          <el-button :disabled="!store.canSendToBack" @click="handleSendToBack">
            <el-icon><Bottom /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 视图控制：标尺 / 网格 / 网格吸附 / 辅助线 / 清空辅助线 -->
      <el-button-group>
        <el-tooltip content="标尺" placement="bottom">
          <el-button :type="store.canvas.showRuler ? 'primary' : 'default'" @click="toggleRuler">
            <el-icon><Rank /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="网格点" placement="bottom">
          <el-button :type="store.canvas.showGrid ? 'primary' : 'default'" @click="toggleGrid">
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="网格吸附" placement="bottom">
          <el-button :type="store.canvas.snapToGrid ? 'primary' : 'default'" @click="toggleSnap">
            <el-icon><Magnet /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="辅助线显示" placement="bottom">
          <el-button :type="store.canvas.showGuides ? 'primary' : 'default'" @click="toggleGuides">
            <el-icon><Guide /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="清空所有辅助线" placement="bottom">
          <el-button :disabled="!store.guides.length" @click="handleClearGuides">
            <el-icon><CircleClose /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 缩放控制：ZoomOut / 下拉档位 / ZoomIn / 还原画布 -->
      <div class="zoom-control">
        <el-tooltip content="缩小" placement="bottom">
          <el-button size="small" @click="zoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
        </el-tooltip>
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
        <el-tooltip content="放大" placement="bottom">
          <el-button size="small" @click="zoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="还原画布 (重置缩放与位置)" placement="bottom">
          <el-button size="small" @click="handleResetViewport">
            <el-icon><ScaleToOriginal /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 右侧操作：预览 / 保存 -->
    <div class="header-right">
      <el-button @click="handlePreview">
        <el-icon><View /></el-icon>
        <span>预览</span>
      </el-button>
      <el-button type="primary" :loading="store.isSaving" @click="handleSave">
        <el-icon><FolderChecked /></el-icon>
        <span>保存</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  RefreshLeft,
  RefreshRight,
  CopyDocument,
  Delete,
  Collection,
  Top,
  Bottom,
  ArrowUp,
  ArrowDown,
  View,
  Hide,
  Lock,
  Unlock,
  Rank,
  Grid,
  Magnet,
  Guide,
  CircleClose,
  ZoomIn,
  ZoomOut,
  FolderChecked,
  ScaleToOriginal,
} from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useCanvasZoom } from '@/views/bi-editor/composables/useCanvas'

const route = useRoute()
const router = useRouter()
const store = useBiEditorStore()
const { zoomOptions, zoomIn, zoomOut } = useCanvasZoom()

// ========== Convenience computed for selected component's visible / locked state ==========
const currentVisible = computed(() => store.selectedComponent?.visible ?? true)
const currentLocked = computed(() => store.selectedComponent?.locked ?? false)

// ========== 视图开关 ==========
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
// ========== 组件操作 ==========
function handleDuplicate() {
  if (store.selectedId) store.duplicateComponent(store.selectedId)
}
function handleDelete() {
  if (store.selectedId) store.removeComponent(store.selectedId)
}
// ========== 图层顺序 ==========
function handleBringToFront() {
  if (store.selectedId) store.bringToFront(store.selectedId)
}
function handleSendToBack() {
  if (store.selectedId) store.sendToBack(store.selectedId)
}
function handleMoveUp() {
  if (store.selectedId) store.moveUp(store.selectedId)
}
function handleMoveDown() {
  if (store.selectedId) store.moveDown(store.selectedId)
}

// ========== 辅助线 ==========
function handleClearGuides() {
  if (store.guides.length) store.clearGuides()
}

// ========== 视口还原 ==========
function handleResetViewport() {
  store.resetViewport()
}

// ========== 预览 / 保存 ==========
async function handleSave() {
  try {
    await store.saveDashboard()
    // 🔑 新建保存后 URL 还停留在 /bi-editor(无 id),用 replace 补上 id
    //   这样刷新页面能正确加载刚创建的看板,而非进入新建态
    if (route.params.id == null && store.currentDashboardId != null) {
      router.replace(`/bi-editor/${store.currentDashboardId}`)
    }
  } catch {
    // 错误提示由 request 拦截器统一处理,这里只需吞掉避免 unhandled rejection
  }
}

function handlePreview() {
  // 🔑 未保存的看板没有 id,无法预览,提示先保存
  if (store.currentDashboardId == null) {
    ElMessage.warning('请先保存看板后再预览')
    return
  }
  // 🔑 有未保存改动时提示,但仍允许预览(用户可能想看当前编辑态 vs 已保存态)
  if (store.isDirty) {
    ElMessage.info('当前有未保存的修改,预览展示的是已保存版本')
  }
  router.push(`/preview/${store.currentDashboardId}`)
}
</script>

<style scoped lang="less">
.header-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--bi-header-bg, #1f2937);
  border-bottom: 1px solid var(--bi-border-color, #374151);
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
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

/* 🔑 文件名输入框:透明背景,聚焦时才显示边框,视觉上接近纯文本 */
.file-name-input {
  width: 180px;
}

.file-name-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
}

.file-name-input :deep(.el-input__wrapper:hover),
.file-name-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--bi-border-color, #4b5563) inset;
}

.file-name-input :deep(.el-input__inner) {
  color: var(--bi-text-primary, #f3f4f6);
  font-size: 14px;
}

/* 🔑 脏状态圆点:有未保存改动时显示 */
.dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bi-accent, #409eff);
  display: inline-block;
  flex-shrink: 0;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  min-width: 0;
  overflow-x: auto;
  padding: 2px 4px;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-display {
  min-width: 68px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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
  opacity: 0.6;
}

:deep(.el-button--primary) {
  background-color: var(--el-button-bg-color, var(--bi-accent, #409eff));
  border-color: var(--el-button-border-color, var(--bi-accent, #409eff));
}

:deep(.el-divider--vertical) {
  background-color: var(--bi-border-color, #4b5563);
  height: 22px;
}
</style>

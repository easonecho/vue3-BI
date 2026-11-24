<template>
  <div class="header-center">
    <!-- 历史：撤销 / 重做 -->
    <el-button-group>
      <el-tooltip :content="t('editorUi.header.undo')" placement="bottom">
        <el-button :disabled="!store.canUndo()" @click="store.undo()">
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.redo')" placement="bottom">
        <el-button :disabled="!store.canRedo()" @click="store.redo()">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-divider direction="vertical" />

    <!-- 组件操作：复制 / 删除 / 全选 -->
    <el-button-group>
      <el-tooltip
        :content="
          t('editorUi.header.duplicateTip', { count: hasMulti ? ` ×${selectedIds.length}` : '' })
        "
        placement="bottom"
      >
        <el-button :disabled="!hasSelection" @click="duplicateSelection">
          <el-icon><CopyDocument /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip
        :content="
          t('editorUi.header.deleteTip', { count: hasMulti ? ` ×${selectedIds.length}` : '' })
        "
        placement="bottom"
      >
        <el-button :disabled="!hasSelection" @click="deleteSelection">
          <el-icon><Delete /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-divider direction="vertical" />

    <!-- 图层顺序：置顶 / 上移一层 / 下移一层 / 置底
         单选：沿用原有 canBringToFront 等精细判断；
         多选：放宽为「有选中 + 未全锁定，且至少有 1 个组件可操作」 -->
    <el-button-group>
      <el-tooltip :content="t('editorUi.header.bringToFront')" placement="bottom">
        <el-button
          :disabled="!hasSelection || (hasMulti ? false : !store.canBringToFront)"
          @click="bringSelectionToFront"
        >
          <el-icon><Top /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.moveUp')" placement="bottom">
        <el-button
          :disabled="!hasSelection || (hasMulti ? false : !store.canMoveUp)"
          @click="moveSelectionUp"
        >
          <el-icon><ArrowUp /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.moveDown')" placement="bottom">
        <el-button
          :disabled="!hasSelection || (hasMulti ? false : !store.canMoveDown)"
          @click="moveSelectionDown"
        >
          <el-icon><ArrowDown /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.sendToBack')" placement="bottom">
        <el-button
          :disabled="!hasSelection || (hasMulti ? false : !store.canSendToBack)"
          @click="sendSelectionToBack"
        >
          <el-icon><Bottom /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-divider direction="vertical" />

    <!-- 视图控制：标尺 / 网格 / 网格吸附 / 辅助线 / 清空辅助线 -->
    <el-button-group>
      <el-tooltip :content="t('editorUi.header.toggleRuler')" placement="bottom">
        <el-button :type="store.canvas.showRuler ? 'primary' : 'default'" @click="toggleRuler">
          <el-icon><Rank /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.toggleGrid')" placement="bottom">
        <el-button :type="store.canvas.showGrid ? 'primary' : 'default'" @click="toggleGrid">
          <el-icon><Grid /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.toggleSnap')" placement="bottom">
        <el-button :type="store.canvas.snapToGrid ? 'primary' : 'default'" @click="toggleSnap">
          <el-icon><Magnet /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.toggleGuides')" placement="bottom">
        <el-button :type="store.canvas.showGuides ? 'primary' : 'default'" @click="toggleGuides">
          <el-icon><Guide /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('editorUi.header.clearGuides')" placement="bottom">
        <el-button :disabled="!store.guides.length" @click="clearGuides">
          <el-icon><CircleClose /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-divider direction="vertical" />

    <!-- 缩放控制：ZoomOut / 下拉档位 / ZoomIn / 还原画布 -->
    <HeaderZoomControl />
  </div>
</template>

<script setup lang="ts">
import {
  RefreshLeft,
  RefreshRight,
  CopyDocument,
  Delete,
  Top,
  Bottom,
  ArrowUp,
  ArrowDown,
  Rank,
  Grid,
  Magnet,
  Guide,
  CircleClose,
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useHeaderSelection } from '@/views/bi-editor/composables/useHeaderSelection'
import HeaderZoomControl from './HeaderZoomControl.vue'

const store = useBiEditorStore()
const { t } = useI18n()
const {
  selectedIds,
  hasSelection,
  hasMulti,
  duplicateSelection,
  deleteSelection,
  bringSelectionToFront,
  sendSelectionToBack,
  moveSelectionUp,
  moveSelectionDown,
} = useHeaderSelection(store)

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

// ========== 辅助线 ==========
function clearGuides() {
  if (store.guides.length) store.clearGuides()
}
</script>

<style scoped lang="less">
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
</style>

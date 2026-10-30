<template>
  <div class="layer-tab">
    <!-- 🔑 图层搜索：按名称模糊过滤（不区分大小写） -->
    <div class="layer-toolbar">
      <el-input
        v-model="layerKeyword"
        size="small"
        clearable
        placeholder="搜索图层名称…"
        :prefix-icon="Search"
      />
      <div v-if="layerKeyword" class="layer-toolbar__count">
        {{ filteredLayerList.length }} / {{ store.layerList.length }}
      </div>
    </div>
    <div class="layer-list">
      <div
        v-for="layer in filteredLayerList"
        :key="layer.id"
        class="layer-item"
        :class="{
          active: layer.id === store.selectedId,
          'multi-selected': store.selectedIdSet.has(layer.id),
          hidden: !layer.visible,
        }"
        @click="onLayerClick($event, layer)"
        @dblclick.stop="startRename(layer)"
        @contextmenu.prevent="onLayerContextMenu($event, layer)"
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
          <el-input
            v-if="renamingId === layer.id"
            ref="renameInputRef"
            v-model="renameDraft"
            size="small"
            class="layer-name-input"
            @click.stop
            @blur="commitRename(layer)"
            @keyup.enter="commitRename(layer)"
            @keyup.esc="cancelRename"
          />
          <span v-else class="layer-name" :class="{ hidden: !layer.visible }">
            {{ layer.name }}
          </span>
          <div v-if="layer.groupId" class="layer-tag">组</div>
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
    <!-- 🔑 图层右键菜单（与画布/组件右键复用 ContextMenu.vue） -->
    <LayerContextMenu ref="layerCtxRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import {
  DocumentCopy,
  Scissor,
  Delete,
  CopyDocument,
  Top,
  Bottom,
  Upload,
  Promotion,
  Hide as HideIcon,
  Lock as LockIcon,
  Setting,
  Edit,
  Search,
  View,
  Hide,
  Lock,
  Unlock,
} from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import ContextMenu from '../ContextMenu.vue'
import type { ContextMenuGroups } from '../ContextMenu.vue'
import ComponentRenderer from '../ComponentRenderer.vue'

const store = useBiEditorStore()

/** 🔑 图层搜索：按名称模糊过滤（不区分大小写），关键词为空时与 store.layerList 一致 */
const layerKeyword = ref('')
const filteredLayerList = computed(() => {
  const kw = layerKeyword.value.trim().toLowerCase()
  if (!kw) return store.layerList
  return store.layerList.filter((l) => l.name.toLowerCase().includes(kw))
})

// ========== 🔑 图层列表交互 ==========
/** 图层右键菜单（ContextMenu 别名） */
const LayerContextMenu = ContextMenu
const layerCtxRef = ref<InstanceType<typeof ContextMenu> | null>(null)

/** 图层点击：支持 Shift+Click（范围选中）、Ctrl/Cmd+Click（切换选择） */
function onLayerClick(e: MouseEvent, layer: ComponentInstance) {
  const isMultiModifier = e.shiftKey || e.ctrlKey || e.metaKey
  if (!isMultiModifier) {
    store.selectComponent(layer.id)
    return
  }
  // Ctrl: 切换单个；Shift: 范围选中（从最后主选中项到当前项中间全部选中）
  if (e.ctrlKey || e.metaKey) {
    store.selectComponentAccum(layer.id, true)
    return
  }
  // Shift+Click：按 store.layerList 的顺序，将 selectedId (主选) 与 layer.id 之间的所有组件一并选中
  if (e.shiftKey) {
    const order = store.layerList.map((l) => l.id)
    const fromIdx = order.indexOf(store.selectedId || layer.id)
    const toIdx = order.indexOf(layer.id)
    const [a, b] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
    store.clearSelection()
    for (let i = a; i <= b; i++) {
      store.selectComponentAccum(order[i], false)
    }
    store.selectComponentAccum(layer.id, false)
  }
}

/** 🔑 双击重命名 */
const renamingId = ref<string | null>(null)
const renameDraft = ref('')
const renameInputRef = ref<{ focus?: () => void; select?: () => void } | null>(null)
function startRename(layer: ComponentInstance) {
  renamingId.value = layer.id
  renameDraft.value = layer.name
  nextTick(() => {
    renameInputRef.value?.focus?.()
    renameInputRef.value?.select?.()
  })
}
function commitRename(layer: ComponentInstance) {
  if (renamingId.value !== layer.id) return
  const newName = renameDraft.value.trim()
  if (newName && newName !== layer.name) {
    store.updateComponent(layer.id, { name: newName })
  }
  renamingId.value = null
}
function cancelRename() {
  renamingId.value = null
}

/** 🔑 图层右键菜单：与画布组件右键一致 */
function onLayerContextMenu(e: MouseEvent, layer: ComponentInstance) {
  if (!layerCtxRef.value) return
  // 右键若不在选中集合内，则先单选目标组件
  if (!store.selectedIdSet.has(layer.id)) {
    store.selectComponent(layer.id)
  }
  const comp = store.selectedComponent
  const groups: ContextMenuGroups = [
    [
      {
        label: '重命名',
        icon: Edit,
        shortcut: '双击图层',
        disabled: !store.selectedId,
        action: () => comp && startRename(comp),
      },
      { divider: true },
      {
        label: '剪切',
        icon: Scissor,
        shortcut: 'Ctrl+X',
        action: () => {
          store.copyToClipboard()
          if (store.selectedId) {
            store.removeComponent(store.selectedId)
            store.clearSelection()
          }
        },
      },
      {
        label: '复制',
        icon: DocumentCopy,
        shortcut: 'Ctrl+C',
        action: () => store.copyToClipboard(),
      },
      {
        label: '复制此组件',
        icon: CopyDocument,
        shortcut: 'Ctrl+D',
        disabled: !store.selectedId,
        action: () => store.selectedId && store.duplicateComponent(store.selectedId),
      },
      {
        label: '删除',
        icon: Delete,
        shortcut: 'Delete',
        danger: true,
        disabled: !store.selectedId,
        action: () => {
          const ids =
            store.selectedIds.length > 0
              ? [...store.selectedIds]
              : store.selectedId
                ? [store.selectedId]
                : []
          ids.forEach((id) => store.removeComponent(id))
          store.clearSelection()
        },
      },
    ],
    [
      {
        label: '图层置顶',
        icon: Top,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.bringToFront(store.selectedId),
      },
      {
        label: '图层上移',
        icon: Promotion,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.moveUp(store.selectedId),
      },
      {
        label: '图层下移',
        icon: Upload,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.moveDown(store.selectedId),
      },
      {
        label: '图层置底',
        icon: Bottom,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.sendToBack(store.selectedId),
      },
      { divider: true },
      {
        label: '组合',
        icon: Setting,
        disabled: !store.canGroup,
        action: () => store.groupSelection(),
      },
      {
        label: '取消组合',
        icon: Setting,
        disabled: !store.canUngroup,
        action: () => store.ungroupSelection(),
      },
    ],
    [
      {
        label: comp?.visible ? '隐藏组件' : '显示组件',
        icon: HideIcon,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.toggleVisibility(store.selectedId),
      },
      {
        label: comp?.locked ? '解锁组件' : '锁定组件',
        icon: LockIcon,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.toggleLock(store.selectedId),
      },
    ],
  ]
  layerCtxRef.value.show(e.clientX, e.clientY, groups)
}

/**
 * 🔑 计算缩略图内层 wrapper 的居中缩放样式：
 *   - 外层 position: relative + overflow: hidden + 固定尺寸视口
 *   - 内层 position: absolute; left:50%; top:50%;
 *   - transform: translate(-50%,-50%) scale(x) —— 先按自身尺寸平移居中，再从中心整体缩放
 *   - transform-origin: center center —— 无论 scale 多少，视觉中心都落在视口中心
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
</script>

<style scoped lang="less">
/* ===== 图层搜索 & 列表 ===== */
.layer-tab {
  height: 100%;
}

.layer-toolbar {
  margin: 4px 8px 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  }
  :deep(.el-input__inner) {
    color: var(--bi-text-primary, #f3f4f6);
  }
  &__count {
    font-size: 12px;
    color: var(--bi-text-muted, #9ca3af);
    white-space: nowrap;
  }
}
.layer-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 100%;
  box-sizing: border-box;
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
  position: relative;

  &:hover {
    background: var(--bi-layer-hover-bg, #4b5563);
  }

  &.active {
    background: var(--bi-layer-active-bg, rgba(30, 64, 175, 0.55));
    border-color: var(--bi-accent, #409eff);
  }
  /* 🔑 多选的非主选成员：加左色条指示 + 浅色背景 */
  &.multi-selected {
    background: rgba(64, 158, 255, 0.18);
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 2px;
      background: var(--bi-accent, #409eff);
    }
  }
  &.hidden .layer-thumb__inner {
    filter: grayscale(1) opacity(0.5);
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

.layer-tag {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  line-height: 1.4;
  color: #fff;
  background: #8b5cf6;
  border-radius: 10px;
  flex-shrink: 0;
}

.layer-name-input {
  width: 100%;
  :deep(.el-input__wrapper) {
    padding: 2px 6px;
    box-shadow: 0 0 0 1px var(--bi-accent, #409eff) inset;
    background: rgba(30, 64, 175, 0.25);
  }
  :deep(.el-input__inner) {
    color: var(--bi-text-primary, #f3f4f6);
    font-size: 13px;
    height: 24px;
  }
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
</style>

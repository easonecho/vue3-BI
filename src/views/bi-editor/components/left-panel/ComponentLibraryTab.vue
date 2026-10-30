<template>
  <div class="component-library">
    <!-- 按分类的折叠面板：每个 CATEGORY_LABEL 作为一个 el-collapse-item，点击可展开/收起 -->
    <el-collapse v-model="activeCollapseGroups">
      <el-collapse-item
        v-for="(catLabel, catKey) in CATEGORY_LABELS"
        v-show="filteredComponents(catKey).length > 0"
        :key="catKey"
        :name="catKey"
      >
        <template #title>
          <span class="collapse-title">{{ catLabel }}</span>
        </template>
        <div class="component-grid">
          <div
            v-for="compMeta in filteredComponents(catKey)"
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
                :style="previewScaleStyle(compMeta.defaultWidth, compMeta.defaultHeight, 96, 60)"
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ComponentMeta, ComponentCategory, ComponentInstance } from '@/views/bi-editor/types'
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  CATEGORY_KEYS,
  getDefaultProps,
} from '@/views/bi-editor/component-defs'
import ComponentRenderer from '../ComponentRenderer.vue'
import { preloadComponent } from '@/views/bi-editor/component-defs/registry'

const props = defineProps<{
  /** 侧边栏是否收起：收起时折叠所有分类，展开时恢复 */
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'drag-start', event: DragEvent, meta: ComponentMeta): void
  (e: 'add-component', meta: ComponentMeta): void
}>()

/** 组件库折叠面板：默认所有分类都展开 */
const activeCollapseGroups = ref<ComponentCategory[]>([...CATEGORY_KEYS])
/** 切换 collapsed 时：收起后就把所有折叠面板关闭，展开时恢复 */
watch(
  () => props.collapsed,
  (v) => {
    if (v) {
      activeCollapseGroups.value = []
    } else {
      activeCollapseGroups.value = [...CATEGORY_KEYS]
    }
  },
)

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
function filteredComponents(category: string): ComponentMeta[] {
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
</script>

<style scoped lang="less">
/* ===== 组件库 ===== */
.component-library {
  width: 100%; /* 🔑 限制宽度，禁止超过 el-tabs__content */
  padding: 12px;
  display: flex;
  flex-direction: column;
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
</style>

<template>
  <div v-if="store.selectedComponent" class="props-section">
    <!-- 🔑 折叠面板：将「基础 / 位置 & 尺寸 / 层级 / 状态」与各 Schema group 都做成可折叠项 -->
    <el-collapse v-model="activePropSections">
      <!-- 基础属性 -->
      <el-collapse-item name="basic">
        <template #title>
          <span class="collapse-title">基础</span>
        </template>
        <div class="form-item">
          <label>名称</label>
          <el-input
            :model-value="store.selectedComponent.name"
            @update:model-value="(v: string) => updateField('name', v)"
          />
        </div>
      </el-collapse-item>

      <!-- 位置和尺寸 -->
      <el-collapse-item name="layout">
        <template #title>
          <span class="collapse-title">位置 &amp; 尺寸</span>
        </template>
        <div class="form-row">
          <div class="form-item">
            <label>X</label>
            <el-input-number
              :model-value="store.selectedComponent.x"
              size="small"
              controls-position="right"
              @update:model-value="(v: number) => updateField('x', v)"
            />
          </div>
          <div class="form-item">
            <label>Y</label>
            <el-input-number
              :model-value="store.selectedComponent.y"
              size="small"
              controls-position="right"
              @update:model-value="(v: number) => updateField('y', v)"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label>宽</label>
            <el-input-number
              :model-value="store.selectedComponent.width"
              size="small"
              controls-position="right"
              :min="1"
              @update:model-value="(v: number) => updateField('width', v)"
            />
          </div>
          <div class="form-item">
            <label>高</label>
            <el-input-number
              :model-value="store.selectedComponent.height"
              size="small"
              controls-position="right"
              :min="1"
              @update:model-value="(v: number) => updateField('height', v)"
            />
          </div>
        </div>
      </el-collapse-item>

      <!-- 🔑 代码配置：展开后显示编辑/导入/导出按钮，点击编辑弹出 Monaco Editor -->
      <el-collapse-item name="code">
        <template #title>
          <span class="collapse-title">代码配置</span>
        </template>
        <ComponentCodeConfig />
      </el-collapse-item>

      <!-- 层级控制 -->
      <el-collapse-item name="zindex">
        <template #title>
          <span class="collapse-title">层级</span>
        </template>
        <div class="layer-actions">
          <el-button
            size="small"
            :disabled="!store.canBringToFront"
            @click="store.bringToFront(store.selectedComponent!.id)"
            >置顶</el-button
          >
          <el-button
            size="small"
            :disabled="!store.canMoveUp"
            @click="store.moveUp(store.selectedComponent!.id)"
            >上移</el-button
          >
          <el-button
            size="small"
            :disabled="!store.canMoveDown"
            @click="store.moveDown(store.selectedComponent!.id)"
            >下移</el-button
          >
          <el-button
            size="small"
            :disabled="!store.canSendToBack"
            @click="store.sendToBack(store.selectedComponent!.id)"
            >置底</el-button
          >
        </div>
      </el-collapse-item>

      <!-- 🔑 分组 / 取消分组 -->
      <el-collapse-item name="group">
        <template #title>
          <span class="collapse-title">分组</span>
        </template>
        <GroupActions show-hint />
      </el-collapse-item>

      <!-- 🔑 对齐 / 分布 -->
      <el-collapse-item name="align">
        <template #title>
          <span class="collapse-title">对齐 &amp; 分布</span>
        </template>
        <AlignActions />
      </el-collapse-item>

      <!-- 状态控制 -->
      <el-collapse-item name="state">
        <template #title>
          <span class="collapse-title">状态</span>
        </template>
        <div class="form-item">
          <div class="form-check">
            <el-checkbox
              :model-value="store.selectedComponent.visible"
              @update:model-value="(v: boolean) => updateField('visible', v)"
              >可见</el-checkbox
            >
          </div>
          <div class="form-check">
            <el-checkbox
              :model-value="store.selectedComponent.locked"
              @update:model-value="(v: boolean) => updateField('locked', v)"
              >锁定</el-checkbox
            >
          </div>
        </div>
      </el-collapse-item>

      <!-- 🔑 Schema 驱动：按 group 分组渲染组件特有属性（每个 group 也做成一个可折叠项） -->
      <template v-if="currentDefinition">
        <el-collapse-item
          v-for="group in fieldGroups"
          :key="`schema-${group}`"
          :name="`schema-${group}`"
        >
          <template #title>
            <span class="collapse-title">{{ group }}</span>
          </template>
          <PropFieldRenderer
            v-for="field in getGroupFields(group)"
            :key="field.key"
            :field="field"
            :model-value="getProp(field.key)"
            :all-props="store.selectedComponent!.props"
            @update:model-value="(v) => updateProp(field.key, v)"
          />
        </el-collapse-item>
      </template>
    </el-collapse>

    <div v-if="!currentDefinition" class="section section--plain">
      <div class="section-title">组件属性</div>
      <div class="placeholder-text">此组件暂无可配置的属性</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropField } from '@/views/bi-editor/component-defs/types'
import { useBiEditorStore } from '@/stores/bi-editor'
import { getDefinition } from '@/views/bi-editor/component-defs'
import PropFieldRenderer from '../PropFieldRenderer.vue'
import ComponentCodeConfig from './ComponentCodeConfig.vue'
import AlignActions from './AlignActions.vue'
import GroupActions from './GroupActions.vue'

const store = useBiEditorStore()

/** 默认展开的折叠项（内置固定分类 + 所有 Schema group 全展开） */
const activePropSections = ref<string[]>([])

const currentDefinition = computed(() => {
  const type = store.selectedComponent?.type
  return type ? getDefinition(type) : undefined
})

/** 按 group 分组的字段列表（无 group 的归入"组件属性"默认组） */
const fieldGroups = computed(() => {
  if (!currentDefinition.value) return []
  const groups = new Set<string>()
  for (const field of currentDefinition.value.propsSchema) {
    groups.add(field.group || '组件属性')
  }
  return Array.from(groups)
})

function getGroupFields(group: string): PropField[] {
  if (!currentDefinition.value) return []
  return currentDefinition.value.propsSchema.filter((f) => (f.group || '组件属性') === group)
}

function getProp(key: string): any {
  return store.selectedComponent?.props?.[key]
}

function updateField(field: string, value: any) {
  if (store.selectedId) {
    store.updateComponent(store.selectedId, { [field]: value })
  }
}

function updateProp(key: string, value: any) {
  if (store.selectedId) {
    const comp = store.selectedComponent
    if (comp) {
      store.updateComponent(store.selectedId, {
        props: { ...comp.props, [key]: value },
      })
    }
  }
}
</script>

<style scoped lang="less">
@import './shared.less';

/* 🔑 属性面板的折叠样式（保持和 LeftPanel 视觉一致） */
.props-section :deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
  background: transparent;
}

.props-section :deep(.el-collapse-item) {
  border-bottom: 1px solid var(--bi-border-color, #374151);
  background: transparent;
  margin-bottom: 4px;
}

.props-section :deep(.el-collapse-item__header) {
  height: 30px;
  line-height: 30px;
  padding: 0 4px;
  background: transparent;
  border-bottom: none;
  color: var(--bi-text-muted, #6b7280);
  font-weight: 600;
}

.props-section :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background: transparent;
  will-change: auto;
}

.props-section :deep(.el-collapse-item__content) {
  padding: 8px 4px 14px;
  background: transparent;
  color: inherit;
}

.layer-actions {
  display: flex;
  gap: 6px;
}

:deep(.layer-actions .el-button) {
  flex: 1;
  min-width: 50px;
}
</style>

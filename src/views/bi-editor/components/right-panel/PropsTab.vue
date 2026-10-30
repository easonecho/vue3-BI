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

  <!-- 🔑 多选批量修改面板：选中 >1 个组件时显示此精简模式（批量状态/样式/分组） -->
  <div v-else-if="hasMultiSelection" class="props-section multi-edit">
    <div class="multi-summary">已选择 <b>{{ multiSelectedIds.length }}</b> 个组件</div>
    <el-collapse v-model="multiActiveSections">
      <!-- 批量状态：可见/锁定 -->
      <el-collapse-item name="state">
        <template #title><span class="collapse-title">批量状态</span></template>
        <div class="form-item">
          <div class="form-check">
            <el-checkbox
              :model-value="sharedState.visible"
              :indeterminate="sharedState.visibleMixed"
              @update:model-value="(v: boolean) => batchSetField('visible', v)"
              >可见</el-checkbox
            >
          </div>
          <div class="form-check">
            <el-checkbox
              :model-value="sharedState.locked"
              :indeterminate="sharedState.lockedMixed"
              @update:model-value="(v: boolean) => batchSetField('locked', v)"
              >锁定</el-checkbox
            >
          </div>
        </div>
      </el-collapse-item>

      <!-- 🔑 分组 / 取消分组 -->
      <el-collapse-item name="group">
        <template #title><span class="collapse-title">分组</span></template>
        <GroupActions />
      </el-collapse-item>

      <!-- 批量对齐 / 分布 -->
      <el-collapse-item name="align">
        <template #title><span class="collapse-title">对齐 &amp; 分布</span></template>
        <AlignActions />
      </el-collapse-item>

      <!-- 批量基础样式：背景色 / 圆角 -->
      <el-collapse-item name="style">
        <template #title><span class="collapse-title">批量样式</span></template>
        <div class="form-item">
          <label>背景色</label>
          <el-color-picker
            :model-value="sharedStyle.backgroundColor"
            @update:model-value="(v: string) => batchSetStyle('backgroundColor', v)"
          />
          <div v-if="sharedStyle.mixedBg" class="mixed-hint">选中组件背景色不一致</div>
        </div>
        <div class="form-item">
          <label>边框圆角</label>
          <el-input-number
            :model-value="sharedStyle.borderRadius"
            :min="0"
            :max="50"
            @update:model-value="(v: number) => batchSetStyle('borderRadius', v)"
          />
          <div v-if="sharedStyle.mixedRadius" class="mixed-hint">选中组件圆角不一致</div>
        </div>
      </el-collapse-item>
    </el-collapse>
    <div class="multi-tip">提示：点击画布任意组件可退出多选模式查看单组件完整属性面板</div>
  </div>

  <!-- 未选中状态 -->
  <el-empty v-else description="请选择组件查看属性" :image-size="100" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useBiEditorStore } from '@/stores/bi-editor'
import { getDefinition } from '@/views/bi-editor/component-defs'
import type { PropField } from '@/views/bi-editor/component-defs/types'
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

// ========== 🔑 多选批量修改 ==========
/** 多选面板：有 >1 个组件被选中（且主选仍然存在），显示批量修改面板 */
const multiSelectedIds = computed<string[]>(() =>
  store.selectedIds.length > 0 ? [...store.selectedIds] : [],
)
const hasMultiSelection = computed(
  () => !store.selectedComponent && multiSelectedIds.value.length > 0,
)
const multiActiveSections = ref<string[]>(['state', 'group', 'align', 'style'])

/** 批量：可见/锁定的「共同值 / 混合状态」 */
const sharedState = computed(() => {
  const comps = multiSelectedIds.value
    .map((id) => store.components.find((c) => c.id === id))
    .filter((c): c is ComponentInstance => Boolean(c))
  if (comps.length === 0) {
    return { visible: false, visibleMixed: false, locked: false, lockedMixed: false }
  }
  const firstV = comps[0].visible
  const firstL = comps[0].locked
  const visibleMixed = comps.some((c) => c.visible !== firstV)
  const lockedMixed = comps.some((c) => c.locked !== firstL)
  return {
    visible: visibleMixed ? false : firstV,
    visibleMixed,
    locked: lockedMixed ? false : firstL,
    lockedMixed,
  }
})

/** 批量：基础样式的「共同值 / 混合状态」 */
const sharedStyle = computed(() => {
  const comps = multiSelectedIds.value
    .map((id) => store.components.find((c) => c.id === id))
    .filter((c): c is ComponentInstance => Boolean(c))
  if (comps.length === 0) {
    return {
      backgroundColor: '' as string | undefined,
      mixedBg: false,
      borderRadius: 0,
      mixedRadius: false,
    }
  }
  const firstBg = comps[0].style?.backgroundColor
  const firstR = comps[0].style?.borderRadius ?? 0
  const mixedBg = comps.some((c) => (c.style?.backgroundColor || '') !== (firstBg || ''))
  const mixedRadius = comps.some((c) => (c.style?.borderRadius ?? 0) !== firstR)
  return {
    backgroundColor: mixedBg ? undefined : (firstBg as string),
    mixedBg,
    borderRadius: mixedRadius ? undefined : (firstR as number),
    mixedRadius,
  }
})

/** 批量写入组件一级字段（visible / locked） */
function batchSetField(field: 'visible' | 'locked', value: boolean) {
  for (const id of multiSelectedIds.value) {
    store.updateComponent(id, { [field]: value })
  }
}
/** 批量写入组件 style 字段（backgroundColor / borderRadius） */
function batchSetStyle(field: 'backgroundColor' | 'borderRadius', value: any) {
  for (const id of multiSelectedIds.value) {
    const comp = store.components.find((c) => c.id === id)
    if (!comp) continue
    store.updateComponent(id, {
      style: { ...comp.style, [field]: value },
    })
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

/* ===== 多选批量修改 ===== */
.multi-edit {
  .multi-summary {
    padding: 12px 14px;
    margin: 0 -4px 8px;
    background: rgba(64, 158, 255, 0.12);
    color: var(--bi-text-primary, #f3f4f6);
    border-radius: 6px;
    font-size: 13px;
    b {
      color: var(--bi-accent, #409eff);
      font-size: 15px;
      margin: 0 2px;
    }
  }
  .mixed-hint {
    margin-top: 6px;
    font-size: 12px;
    color: var(--bi-text-muted, #9ca3af);
  }
  .multi-tip {
    margin-top: 14px;
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--bi-text-muted, #9ca3af);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
  }
}
</style>

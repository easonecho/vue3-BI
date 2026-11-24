<template>
  <div class="props-section multi-edit">
    <div class="multi-summary">
      {{ t('editorUi.props.multiSummary', { count: multiSelectedIds.length }) }}
    </div>
    <el-collapse v-model="multiActiveSections">
      <!-- 批量状态：可见/锁定 -->
      <el-collapse-item name="state">
        <template #title
          ><span class="collapse-title">{{ t('editorUi.props.batchState') }}</span></template
        >
        <div class="form-item">
          <div class="form-check">
            <el-checkbox
              :model-value="sharedState.visible"
              :indeterminate="sharedState.visibleMixed"
              @update:model-value="(v: boolean) => batchSetField('visible', v)"
              >{{ t('editorUi.props.visible') }}</el-checkbox
            >
          </div>
          <div class="form-check">
            <el-checkbox
              :model-value="sharedState.locked"
              :indeterminate="sharedState.lockedMixed"
              @update:model-value="(v: boolean) => batchSetField('locked', v)"
              >{{ t('editorUi.props.locked') }}</el-checkbox
            >
          </div>
        </div>
      </el-collapse-item>

      <!-- 🔑 分组 / 取消分组 -->
      <el-collapse-item name="group">
        <template #title
          ><span class="collapse-title">{{ t('editorUi.props.group') }}</span></template
        >
        <GroupActions />
      </el-collapse-item>

      <!-- 批量对齐 / 分布 -->
      <el-collapse-item name="align">
        <template #title
          ><span class="collapse-title">{{ t('editorUi.props.align') }}</span></template
        >
        <AlignActions />
      </el-collapse-item>

      <!-- 批量基础样式：背景色 / 圆角 -->
      <el-collapse-item name="style">
        <template #title
          ><span class="collapse-title">{{ t('editorUi.props.batchStyle') }}</span></template
        >
        <div class="form-item">
          <label>{{ t('editorUi.style.backgroundColor') }}</label>
          <el-color-picker
            :model-value="sharedStyle.backgroundColor"
            @update:model-value="(v: string) => batchSetStyle('backgroundColor', v)"
          />
          <div v-if="sharedStyle.mixedBg" class="mixed-hint">{{ t('editorUi.props.mixedBg') }}</div>
        </div>
        <div class="form-item">
          <label>{{ t('editorUi.style.borderRadius') }}</label>
          <el-input-number
            :model-value="sharedStyle.borderRadius"
            :min="0"
            :max="50"
            @update:model-value="(v: number) => batchSetStyle('borderRadius', v)"
          />
          <div v-if="sharedStyle.mixedRadius" class="mixed-hint">
            {{ t('editorUi.props.mixedRadius') }}
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
    <div class="multi-tip">{{ t('editorUi.props.multiTip') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useBiEditorStore } from '@/stores/bi-editor'
import AlignActions from './AlignActions.vue'
import GroupActions from './GroupActions.vue'

const store = useBiEditorStore()
const { t } = useI18n()

const multiSelectedIds = computed<string[]>(() =>
  store.selectedIds.length > 0 ? [...store.selectedIds] : [],
)
const multiActiveSections = ref<string[]>(['state', 'group', 'align', 'style'])

/** 多选组件实例 */
const multiComponents = computed<ComponentInstance[]>(() =>
  multiSelectedIds.value
    .map((id) => store.components.find((c) => c.id === id))
    .filter((c): c is ComponentInstance => Boolean(c)),
)

/** 批量：可见/锁定的「共同值 / 混合状态」 */
const sharedState = computed(() => {
  const comps = multiComponents.value
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
  const comps = multiComponents.value
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

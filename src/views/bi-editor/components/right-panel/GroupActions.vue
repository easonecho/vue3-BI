<template>
  <div class="group-actions">
    <el-button
      size="small"
      type="primary"
      plain
      :disabled="!store.canGroup"
      @click="store.groupSelection()"
    >
      {{ t('editorUi.props.groupBtn') }}
    </el-button>
    <el-button size="small" :disabled="!store.canUngroup" @click="store.ungroupSelection()">
      {{ t('editorUi.props.ungroupBtn') }}
    </el-button>
  </div>
  <div v-if="showHint && store.selectedComponent?.groupId" class="group-hint">
    {{ t('editorUi.props.groupHint') }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBiEditorStore } from '@/stores/bi-editor'

withDefaults(defineProps<{ showHint?: boolean }>(), { showHint: false })

const store = useBiEditorStore()
const { t } = useI18n()
</script>

<style scoped lang="less">
/* 🔑 分组 */
.group-actions {
  display: flex;
  gap: 8px;
}
:deep(.group-actions .el-button) {
  flex: 1;
  min-width: 0;
}
.group-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--bi-text-muted, #9ca3af);
  padding: 6px 8px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 4px;
  border: 1px dashed rgba(64, 158, 255, 0.4);
}
</style>

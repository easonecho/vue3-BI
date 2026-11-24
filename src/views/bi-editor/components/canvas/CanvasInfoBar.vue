<template>
  <div class="canvas-info-bar">
    <span>{{
      t('editorUi.canvas.infoCanvas', { width: store.canvas.width, height: store.canvas.height })
    }}</span>
    <ElDivider direction="vertical" />
    <span>{{ t('editorUi.canvas.infoZoom', { percent: Math.round(localScale * 100) }) }}</span>
    <ElDivider direction="vertical" />
    <span>
      {{ t('editorUi.canvas.infoSelection') }}
      <template v-if="store.selectedIds.length > 1">
        {{ t('editorUi.canvas.infoMulti', { count: store.selectedIds.length }) }}
        <template v-if="store.selectedComponent">{{
          t('editorUi.canvas.infoPrimary', { name: store.selectedComponent.name })
        }}</template>
      </template>
      <template v-else-if="store.selectedComponent">
        {{ store.selectedComponent.name }} ({{ Math.round(store.selectedComponent.x) }},
        {{ Math.round(store.selectedComponent.y) }})
        {{ Math.round(store.selectedComponent.width) }}×{{
          Math.round(store.selectedComponent.height)
        }}
      </template>
      <template v-else>{{ t('editorUi.canvas.infoUnselected') }}</template>
    </span>
    <ElDivider direction="vertical" />
    <span>{{ t('editorUi.canvas.infoComponents', { count: store.components.length }) }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBiEditorStore } from '@/stores/bi-editor'
import { ElDivider } from 'element-plus'

interface Props {
  localScale: number
}
defineProps<Props>()

const store = useBiEditorStore()
const { t } = useI18n()
</script>

<style scoped lang="less">
.canvas-info-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: var(--bi-info-bar-bg, #111827);
  border-top: 1px solid var(--bi-border-color, #374151);
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
  z-index: 2;
}
</style>

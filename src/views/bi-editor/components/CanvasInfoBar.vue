<template>
  <div class="canvas-info-bar">
    <span>画布: {{ store.canvas.width }} × {{ store.canvas.height }}</span>
    <el-divider direction="vertical" />
    <span>缩放: {{ Math.round(localScale * 100) }}%</span>
    <el-divider direction="vertical" />
    <span>
      选中:
      <template v-if="store.selectedIds.length > 1">
        共 {{ store.selectedIds.length }} 个组件
        <template v-if="store.selectedComponent">(主选: {{ store.selectedComponent.name }})</template>
      </template>
      <template v-else-if="store.selectedComponent">
        {{ store.selectedComponent.name }} ({{ Math.round(store.selectedComponent.x) }},
        {{ Math.round(store.selectedComponent.y) }})
        {{ Math.round(store.selectedComponent.width) }}×{{
          Math.round(store.selectedComponent.height)
        }}
      </template>
      <template v-else>未选择</template>
    </span>
    <el-divider direction="vertical" />
    <span>组件数: {{ store.components.length }}</span>
  </div>
</template>

<script setup lang="ts">
import { useBiEditorStore } from '@/stores/bi-editor'
import { ElDivider } from 'element-plus'

interface Props {
  localScale: number
}
defineProps<Props>()

const store = useBiEditorStore()
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

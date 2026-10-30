<template>
  <div class="align-section">
    <div class="align-label">水平对齐</div>
    <div class="align-row">
      <el-button size="small" :disabled="!canAlign" @click="store.alignLeft()">左对齐</el-button>
      <el-button size="small" :disabled="!canAlign" @click="store.alignHCenter()"
        >水平居中</el-button
      >
      <el-button size="small" :disabled="!canAlign" @click="store.alignRight()">右对齐</el-button>
    </div>
    <div class="align-label">垂直对齐</div>
    <div class="align-row">
      <el-button size="small" :disabled="!canAlign" @click="store.alignTop()">顶对齐</el-button>
      <el-button size="small" :disabled="!canAlignMulti" @click="store.alignVCenter()"
        >垂直居中</el-button
      >
      <el-button size="small" :disabled="!canAlignMulti" @click="store.alignBottom()"
        >底对齐</el-button
      >
    </div>
    <div class="align-label">等距分布（≥3 个组件）</div>
    <div class="align-row">
      <el-button size="small" :disabled="!canDistribute" @click="store.distributeHorizontal()"
        >水平分布</el-button
      >
      <el-button size="small" :disabled="!canDistribute" @click="store.distributeVertical()"
        >垂直分布</el-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'

const store = useBiEditorStore()

/**
 * 🔑 对齐 / 分布可用性判定
 * canAlign：至少有 1 个组件（左/右/顶/底、水平居中对单选也生效，即贴画布）
 * canAlignMulti：至少有 2 个组件（垂直居中/底对齐只支持多选集合）
 * canDistribute：至少 3 个组件（等距分布的数学要求）
 */
const selectedCount = computed(() =>
  store.selectedIds.length > 0 ? store.selectedIds.length : store.selectedId ? 1 : 0,
)
const canAlign = computed(() => selectedCount.value >= 1)
const canAlignMulti = computed(() => selectedCount.value >= 2)
const canDistribute = computed(() => selectedCount.value >= 3)
</script>

<style scoped lang="less">
/* 🔑 对齐 / 分布工具条 */
.align-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.align-label {
  font-size: 12px;
  color: var(--bi-text-muted, #9ca3af);
  margin-top: 2px;
}
.align-row {
  display: flex;
  gap: 6px;
}
:deep(.align-row .el-button) {
  flex: 1;
  min-width: 0;
  padding: 6px 4px;
  font-size: 12px;
}
</style>

<template>
  <div class="header-left">
    <div class="logo">
      <el-icon :size="24" color="#409EFF"><DataAnalysis /></el-icon>
      <span class="logo-text">{{ store.isTemplateMode ? '模板编辑器' : 'BI 编辑器' }}</span>
    </div>
    <el-divider direction="vertical" />
    <el-input
      v-model="store.dashboardName"
      class="file-name-input"
      size="small"
      placeholder="未命名报表"
    />
    <span v-if="store.isDirty" class="dirty-dot" title="有未保存的修改"></span>
  </div>
</template>

<script setup lang="ts">
import { DataAnalysis } from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'

const store = useBiEditorStore()
</script>

<style scoped lang="less">
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--bi-text-primary, #f3f4f6);
}

/* 🔑 文件名输入框：透明背景，聚焦时才显示边框，视觉上接近纯文本 */
.file-name-input {
  width: 180px;
}

.file-name-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
}

.file-name-input :deep(.el-input__wrapper:hover),
.file-name-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--bi-border-color, #4b5563) inset;
}

.file-name-input :deep(.el-input__inner) {
  color: var(--bi-text-primary, #f3f4f6);
  font-size: 14px;
}

/* 🔑 脏状态圆点：有未保存改动时显示 */
.dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bi-accent, #409eff);
  display: inline-block;
  flex-shrink: 0;
}
</style>

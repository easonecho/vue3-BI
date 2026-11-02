<template>
  <div class="header-toolbar">
    <HeaderLeft />
    <HeaderCenter />
    <HeaderRight @open-template-dialog="templateMetaVisible = true" />
    <HeaderTemplateDialog v-model="templateMetaVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HeaderLeft from './header/HeaderLeft.vue'
import HeaderCenter from './header/HeaderCenter.vue'
import HeaderRight from './header/HeaderRight.vue'
import HeaderTemplateDialog from './header/HeaderTemplateDialog.vue'

/** 模板编辑模式保存时收集元数据的对话框 */
const templateMetaVisible = ref(false)
</script>

<style scoped lang="less">
.header-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--bi-header-bg, #1f2937);
  border-bottom: 1px solid var(--bi-border-color, #374151);
  gap: 16px;
}

/* 顶栏统一按钮/分割线皮肤（子组件按钮同样命中，因 :deep 从 toolbar 根向下匹配） */
:deep(.el-button) {
  background: var(--bi-btn-bg, #374151);
  border-color: var(--bi-btn-border, #4b5563);
  color: var(--bi-text-primary, #f3f4f6);
}

:deep(.el-button:hover) {
  background: var(--bi-btn-hover, #4b5563);
  border-color: var(--bi-btn-border, #6b7280);
}

:deep(.el-button.is-disabled) {
  background: var(--bi-btn-disabled, #374151);
  opacity: 0.6;
}

:deep(.el-button--primary) {
  background-color: var(--el-button-bg-color, var(--bi-accent, #409eff));
  border-color: var(--el-button-border-color, var(--bi-accent, #409eff));
}

:deep(.el-divider--vertical) {
  background-color: var(--bi-border-color, #4b5563);
  height: 22px;
}
</style>

<template>
  <el-dialog
    v-model="visible"
    :title="
      dashboard
        ? t('dashboard.versionTitleWithName', { name: dashboard.name })
        : t('dashboard.versionTitle')
    "
    width="900px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="version-toolbar">
      <el-button type="primary" size="small" @click="openSaveDialog">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('dashboard.saveVersion') }}
      </el-button>
      <el-button size="small" :loading="loading" @click="loadVersions">{{
        t('dashboard.refresh')
      }}</el-button>
      <el-input
        v-model="keyword"
        size="small"
        :placeholder="t('dashboard.versionSearchPlaceholder')"
        clearable
        style="width: 200px"
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <span class="version-hint">{{ t('dashboard.versionRestoreHint') }}</span>
    </div>

    <DashboardVersionTable
      v-model:page="page"
      :versions="versions"
      :loading="loading"
      :total="total"
      :page-size="pageSize"
      @view="openDetail"
      @restore="handleRestore"
      @delete="handleDelete"
      @refresh="loadVersions"
    />

    <!-- 保存版本 -->
    <DashboardVersionSaveDialog
      v-model="saveVisible"
      v-model:remark="remark"
      :saving="saving"
      @save="confirmSave"
    />

    <!-- 版本详情 -->
    <DashboardVersionDetailDialog
      v-model="detailVisible"
      :detail="detail"
      :loading="detailLoading"
      @restore="handleRestore"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Search } from '@element-plus/icons-vue'
import DashboardVersionTable from './DashboardVersionTable.vue'
import DashboardVersionSaveDialog from './DashboardVersionSaveDialog.vue'
import DashboardVersionDetailDialog from './DashboardVersionDetailDialog.vue'
import { useDashboardVersions } from '../composables/useDashboardVersions'

const props = defineProps<{
  modelValue: boolean
  dashboard: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'restored'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const { t } = useI18n()

const {
  versions,
  loading,
  page,
  pageSize,
  total,
  keyword,
  saveVisible,
  saving,
  remark,
  detailVisible,
  detailLoading,
  detail,
  handleOpen,
  handleClosed,
  loadVersions,
  handleSearch,
  openSaveDialog,
  confirmSave,
  openDetail,
  handleRestore,
  handleDelete,
} = useDashboardVersions({
  getDashboardId: () => props.dashboard?.id ?? null,
  onRestored: () => emit('restored'),
})

watch(
  () => props.modelValue,
  (value) => {
    if (value && props.dashboard) handleOpen()
  },
)
</script>

<style scoped lang="less">
.version-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.version-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .version-toolbar {
    :deep(.el-input) {
      width: 100% !important;
    }
    .version-hint {
      display: none;
    }
  }
}
</style>

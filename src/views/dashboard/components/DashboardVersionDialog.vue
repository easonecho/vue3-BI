<template>
  <el-dialog
    v-model="visible"
    :title="dashboard ? `版本管理 - ${dashboard.name}` : '版本管理'"
    width="900px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="version-toolbar">
      <el-button type="primary" size="small" @click="openSaveDialog">
        <el-icon><Plus /></el-icon>&nbsp;保存当前版本
      </el-button>
      <el-button size="small" :loading="loading" @click="loadVersions">刷新</el-button>
      <el-input
        v-model="keyword"
        size="small"
        placeholder="搜索版本名称/备注"
        clearable
        style="width: 200px"
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <span class="version-hint">恢复历史版本前会自动备份当前配置，可随时回退</span>
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

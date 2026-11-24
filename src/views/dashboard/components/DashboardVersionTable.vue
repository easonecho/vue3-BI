<template>
  <el-table v-loading="loading" :data="versions" size="small" border>
    <el-table-column :label="t('dashboard.versionCol')" width="80" align="center">
      <template #default="{ row }">
        <el-tag size="small" effect="plain">v{{ row.versionNo }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column
      prop="name"
      :label="t('dashboard.name')"
      min-width="160"
      show-overflow-tooltip
    />
    <el-table-column :label="t('dashboard.remark')" min-width="180" show-overflow-tooltip>
      <template #default="{ row }">{{ row.remark || '-' }}</template>
    </el-table-column>
    <el-table-column :label="t('dashboard.versionCreator')" width="120" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.creator?.nickname || row.creator?.username || '-' }}
      </template>
    </el-table-column>
    <el-table-column :label="t('dashboard.createdAt')" width="170">
      <template #default="{ row }">{{ formatVersionTime(row.createdAt) }}</template>
    </el-table-column>
    <el-table-column :label="t('common.actions')" width="180" align="center">
      <template #default="{ row }">
        <el-button link type="primary" size="small" @click="emit('view', row)">{{
          t('dashboard.view')
        }}</el-button>
        <el-button link type="warning" size="small" @click="emit('restore', row)">{{
          t('dashboard.restore')
        }}</el-button>
        <el-popconfirm
          :title="t('dashboard.versionDeleteConfirm')"
          confirm-button-type="danger"
          @confirm="emit('delete', row)"
        >
          <template #reference>
            <el-button link type="danger" size="small">{{ t('common.delete') }}</el-button>
          </template>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>
  <el-empty
    v-if="!loading && versions.length === 0"
    :description="t('dashboard.versionEmpty')"
    :image-size="60"
  />
  <div v-if="total > pageSize" class="version-pager">
    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      small
      @current-change="emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
import type { DashboardVersion } from '@/api/dashboard-version'
import { useI18n } from 'vue-i18n'
import { formatVersionTime } from '../utils/dashboard-version-utils'

defineProps<{
  versions: DashboardVersion[]
  loading: boolean
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'view', row: DashboardVersion): void
  (e: 'restore', row: DashboardVersion): void
  (e: 'delete', row: DashboardVersion): void
  (e: 'refresh'): void
}>()

const page = defineModel<number>('page', { required: true })

const { t } = useI18n()
</script>

<style scoped lang="less">
.version-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>

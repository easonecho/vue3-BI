<template>
  <div class="report-tab">
    <div class="report-toolbar">
      <el-button size="small" :loading="loading" @click="emit('refresh')">{{
        t('dashboard.refresh')
      }}</el-button>
      <span class="report-hint">{{ t('dashboard.reportDeliveriesHint') }}</span>
    </div>

    <el-table v-loading="loading" :data="deliveries" size="small" border>
      <el-table-column
        prop="title"
        :label="t('dashboard.reportTitle')"
        min-width="260"
        show-overflow-tooltip
      />
      <el-table-column :label="t('dashboard.reportChannel')" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="reportChannelTagType(row.channel)">
            {{ reportChannelLabel(row.channel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.reportStatus')" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 'failed' ? 'danger' : 'success'">
            {{ row.status === 'failed' ? t('common.failed') : t('common.success') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.reportReceived')" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.readFlag === 0 ? 'danger' : 'info'" effect="plain">
            {{ row.readFlag === 0 ? t('dashboard.unread') : t('dashboard.read') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.snapshotGeneratedAt')" width="170">
        <template #default="{ row }">
          <span>{{ formatTime(row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="110" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="emit('preview', row)">{{
            t('dashboard.view')
          }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && deliveries.length === 0"
      :description="t('dashboard.reportDeliveriesEmpty')"
      :image-size="60"
    />
    <div v-if="total > pageSize" class="report-pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        small
        @current-change="emit('refresh')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReportDelivery } from '@/api/report'
import { useI18n } from 'vue-i18n'
import { formatTime } from '../../utils/report-utils'
import { reportChannelLabel, reportChannelTagType } from '../../utils/report-channel'

defineProps<{
  deliveries: ReportDelivery[]
  loading: boolean
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  refresh: []
  preview: [row: ReportDelivery]
}>()

const page = defineModel<number>('page', { required: true })

const { t } = useI18n()
</script>

<style scoped lang="less">
.report-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.report-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.report-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>

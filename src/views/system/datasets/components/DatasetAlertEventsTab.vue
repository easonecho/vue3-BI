<template>
  <div class="alert-toolbar">
    <el-button size="small" :loading="loading" @click="emit('refresh')">{{
      t('datasetPage.alertEventsTab.refresh')
    }}</el-button>
    <el-button size="small" :disabled="unreadCount === 0" @click="emit('read-all')">
      {{ t('datasetPage.alertEventsTab.readAll') }}
    </el-button>
    <span class="alert-hint">{{ t('datasetPage.alertEventsTab.hint') }}</span>
  </div>

  <el-table v-loading="loading" :data="events" size="small" border>
    <el-table-column
      prop="ruleName"
      :label="t('datasetPage.alertEventsTab.colRule')"
      width="150"
      show-overflow-tooltip
    />
    <el-table-column
      prop="message"
      :label="t('datasetPage.alertEventsTab.colMessage')"
      min-width="340"
      show-overflow-tooltip
    />
    <el-table-column :label="t('datasetPage.alertEventsTab.colStatus')" width="90" align="center">
      <template #default="{ row }">
        <el-tag :type="row.status === 0 ? 'danger' : 'info'" size="small" effect="plain">
          {{
            row.status === 0
              ? t('datasetPage.alertEventsTab.unread')
              : t('datasetPage.alertEventsTab.read')
          }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column :label="t('datasetPage.alertEventsTab.colTime')" width="170">
      <template #default="{ row }">
        <span>{{ formatAlertTime(row.createdAt) }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="t('datasetPage.alertEventsTab.colActions')" width="90" align="center">
      <template #default="{ row }">
        <el-button
          v-if="row.status === 0"
          link
          type="primary"
          size="small"
          @click="emit('read-event', row)"
        >
          {{ t('datasetPage.alertEventsTab.markRead') }}
        </el-button>
        <span v-else class="muted">-</span>
      </template>
    </el-table-column>
  </el-table>
  <el-empty
    v-if="!loading && events.length === 0"
    :description="t('datasetPage.alertEventsTab.empty')"
    :image-size="60"
  />
  <div v-if="total > 0" class="alert-pager">
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
import { useI18n } from 'vue-i18n'
import type { AlertEvent } from '@/api/alert'
import { formatAlertTime } from '../utils/dataset-alert-utils'

const { t } = useI18n()

defineProps<{
  events: AlertEvent[]
  loading: boolean
  unreadCount: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'read-all'): void
  (e: 'read-event', row: AlertEvent): void
}>()

const page = defineModel<number>('page', { required: true })
</script>

<style scoped lang="less">
.alert-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.alert-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.alert-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>

<template>
  <div class="report-tab">
    <div class="report-toolbar">
      <el-button type="primary" size="small" @click="emit('create')">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('dashboard.reportAddSubscription') }}
      </el-button>
      <el-button size="small" :loading="loading" @click="emit('refresh')">{{
        t('dashboard.refresh')
      }}</el-button>
      <span class="report-hint">
        {{ t('dashboard.reportSubscriptionsHint') }}
      </span>
    </div>

    <el-table v-loading="loading" :data="subscriptions" size="small" border>
      <el-table-column
        prop="name"
        :label="t('dashboard.reportSubscriptionName')"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column :label="t('dashboard.reportCron')" width="130">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.cron }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.reportChannel')" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="reportChannelTagType(row.channel)">
            {{ reportChannelLabel(row.channel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('dashboard.reportRecipients')"
        min-width="150"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row.recipients || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.reportLastRun')" width="200">
        <template #default="{ row }">
          <div v-if="row.lastRunAt" class="last-run">
            <span>{{ formatTime(row.lastRunAt) }}</span>
            <span :class="['last-status', row.lastStatus === 'failed' ? 'is-failed' : '']">
              {{ row.lastStatus === 'failed' ? t('common.failed') : t('common.success') }}
            </span>
          </div>
          <span v-else class="muted">{{ t('dashboard.reportNotGenerated') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.reportEnabled')" width="70" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" size="small" @change="emit('toggle-enabled', row)" />
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="210" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="emit('run-now', row)">{{
            t('dashboard.reportRunNow')
          }}</el-button>
          <el-button link type="primary" size="small" @click="emit('edit', row)">{{
            t('common.edit')
          }}</el-button>
          <el-popconfirm
            :title="t('dashboard.reportDeleteConfirm')"
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
      v-if="!loading && subscriptions.length === 0"
      :description="t('dashboard.reportSubscriptionsEmpty')"
      :image-size="60"
    />
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { ReportSubscription } from '@/api/report'
import { formatTime } from '../../utils/report-utils'
import { reportChannelLabel, reportChannelTagType } from '../../utils/report-channel'

defineProps<{
  subscriptions: ReportSubscription[]
  loading: boolean
}>()

const emit = defineEmits<{
  create: []
  refresh: []
  'toggle-enabled': [row: ReportSubscription]
  edit: [row: ReportSubscription]
  delete: [row: ReportSubscription]
  'run-now': [row: ReportSubscription]
}>()

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

.last-run {
  display: flex;
  flex-direction: column;
  line-height: 16px;
  font-size: 12px;
}

.last-status {
  color: var(--el-color-success);
}

.last-status.is-failed {
  color: var(--el-color-danger);
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>

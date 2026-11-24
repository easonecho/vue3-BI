<template>
  <div class="alert-toolbar">
    <el-button type="primary" size="small" @click="emit('create')">
      <el-icon><Plus /></el-icon>&nbsp;{{ t('datasetPage.alertRulesTab.add') }}
    </el-button>
    <el-button size="small" :loading="loading" @click="emit('refresh')">{{
      t('datasetPage.alertRulesTab.refresh')
    }}</el-button>
    <span class="alert-hint">
      {{ t('datasetPage.alertRulesTab.hint') }}
    </span>
  </div>

  <el-table v-loading="loading" :data="rules" size="small" border>
    <el-table-column
      prop="name"
      :label="t('datasetPage.alertRulesTab.colName')"
      min-width="150"
      show-overflow-tooltip
    />
    <el-table-column :label="t('datasetPage.alertRulesTab.colCondition')" min-width="210">
      <template #default="{ row }">
        <span class="cond-text">{{ conditionLabel(row) }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="t('datasetPage.alertRulesTab.colCron')" width="140">
      <template #default="{ row }">
        <el-tag size="small" effect="plain">{{ row.cron }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column :label="t('datasetPage.alertRulesTab.colLastRun')" width="180">
      <template #default="{ row }">
        <div v-if="row.lastRunAt" class="last-run">
          <span>{{ formatAlertTime(row.lastRunAt) }}</span>
          <span class="last-value">{{
            t('datasetPage.alertRulesTab.result', { value: row.lastValue ?? '-' })
          }}</span>
        </div>
        <span v-else class="muted">{{ t('datasetPage.alertRulesTab.notEvaluated') }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="t('datasetPage.alertRulesTab.colEnabled')" width="70" align="center">
      <template #default="{ row }">
        <el-switch v-model="row.enabled" size="small" @change="emit('toggle-enabled', row)" />
      </template>
    </el-table-column>
    <el-table-column :label="t('datasetPage.alertRulesTab.colActions')" width="190" align="center">
      <template #default="{ row }">
        <el-button link type="primary" size="small" @click="emit('run', row)">{{
          t('datasetPage.alertRulesTab.runNow')
        }}</el-button>
        <el-button link type="primary" size="small" @click="emit('edit', row)">{{
          t('common.edit')
        }}</el-button>
        <el-popconfirm
          :title="t('datasetPage.alertRulesTab.deleteConfirm')"
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
    v-if="!loading && rules.length === 0"
    :description="t('datasetPage.alertRulesTab.empty')"
    :image-size="60"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import type { AlertRule } from '@/api/alert'
import { conditionLabel, formatAlertTime } from '../utils/dataset-alert-utils'

const { t } = useI18n()

defineProps<{
  rules: AlertRule[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'refresh'): void
  (e: 'toggle-enabled', row: AlertRule): void
  (e: 'run', row: AlertRule): void
  (e: 'edit', row: AlertRule): void
  (e: 'delete', row: AlertRule): void
}>()
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

.cond-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.last-run {
  display: flex;
  flex-direction: column;
  line-height: 16px;
  font-size: 12px;
}

.last-value {
  color: var(--el-text-color-secondary);
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>

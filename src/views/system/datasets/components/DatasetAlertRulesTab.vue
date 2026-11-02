<template>
  <div class="alert-toolbar">
    <el-button type="primary" size="small" @click="emit('create')">
      <el-icon><Plus /></el-icon>&nbsp;新增规则
    </el-button>
    <el-button size="small" :loading="loading" @click="emit('refresh')">刷新</el-button>
    <span class="alert-hint">
      按 cron 定时评估数据集指标，超过阈值时生成告警记录（可选 Webhook 回调）
    </span>
  </div>

  <el-table v-loading="loading" :data="rules" size="small" border>
    <el-table-column prop="name" label="规则名称" min-width="150" show-overflow-tooltip />
    <el-table-column label="触发条件" min-width="210">
      <template #default="{ row }">
        <span class="cond-text">{{ conditionLabel(row) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="执行周期" width="140">
      <template #default="{ row }">
        <el-tag size="small" effect="plain">{{ row.cron }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="最近评估" width="180">
      <template #default="{ row }">
        <div v-if="row.lastRunAt" class="last-run">
          <span>{{ formatAlertTime(row.lastRunAt) }}</span>
          <span class="last-value">结果: {{ row.lastValue ?? '-' }}</span>
        </div>
        <span v-else class="muted">尚未评估</span>
      </template>
    </el-table-column>
    <el-table-column label="启用" width="70" align="center">
      <template #default="{ row }">
        <el-switch v-model="row.enabled" size="small" @change="emit('toggle-enabled', row)" />
      </template>
    </el-table-column>
    <el-table-column label="操作" width="190" align="center">
      <template #default="{ row }">
        <el-button link type="primary" size="small" @click="emit('run', row)">立即执行</el-button>
        <el-button link type="primary" size="small" @click="emit('edit', row)">编辑</el-button>
        <el-popconfirm title="确定删除该规则吗?" confirm-button-type="danger" @confirm="emit('delete', row)">
          <template #reference>
            <el-button link type="danger" size="small">删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>
  <el-empty
    v-if="!loading && rules.length === 0"
    description="暂无告警规则，点击「新增规则」开始配置"
    :image-size="60"
  />
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import type { AlertRule } from '@/api/alert'
import { conditionLabel, formatAlertTime } from '../utils/dataset-alert-utils'

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

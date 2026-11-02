<template>
  <div class="report-tab">
    <div class="report-toolbar">
      <el-button type="primary" size="small" @click="emit('create')">
        <el-icon><Plus /></el-icon>&nbsp;新增订阅
      </el-button>
      <el-button size="small" :loading="loading" @click="emit('refresh')">刷新</el-button>
      <span class="report-hint">
        按 cron 定时生成看板数据快照并落库，可在「投递记录」查看；Webhook 渠道额外推送摘要
      </span>
    </div>

    <el-table v-loading="loading" :data="subscriptions" size="small" border>
      <el-table-column prop="name" label="订阅名称" min-width="150" show-overflow-tooltip />
      <el-table-column label="执行周期" width="130">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.cron }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="渠道" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.channel === 'webhook' ? 'warning' : 'primary'">
            {{ row.channel === 'webhook' ? 'Webhook' : '站内' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="收件人" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.recipients || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最近生成" width="200">
        <template #default="{ row }">
          <div v-if="row.lastRunAt" class="last-run">
            <span>{{ formatTime(row.lastRunAt) }}</span>
            <span :class="['last-status', row.lastStatus === 'failed' ? 'is-failed' : '']">
              {{ row.lastStatus === 'failed' ? '失败' : '成功' }}
            </span>
          </div>
          <span v-else class="muted">尚未生成</span>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="70" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" size="small" @change="emit('toggle-enabled', row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="emit('run-now', row)">立即生成</el-button>
          <el-button link type="primary" size="small" @click="emit('edit', row)">编辑</el-button>
          <el-popconfirm
            title="确定删除该订阅吗?"
            confirm-button-type="danger"
            @confirm="emit('delete', row)"
          >
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && subscriptions.length === 0"
      description="暂无订阅，点击「新增订阅」开始配置"
      :image-size="60"
    />
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import type { ReportSubscription } from '@/api/report'
import { formatTime } from '../../utils/report-utils'

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

<template>
  <div class="alert-toolbar">
    <el-button size="small" :loading="loading" @click="emit('refresh')">刷新</el-button>
    <el-button size="small" :disabled="unreadCount === 0" @click="emit('read-all')">
      全部标记已读
    </el-button>
    <span class="alert-hint">告警记录仅保留内容快照，删除规则不会删除历史记录</span>
  </div>

  <el-table v-loading="loading" :data="events" size="small" border>
    <el-table-column prop="ruleName" label="规则" width="150" show-overflow-tooltip />
    <el-table-column prop="message" label="告警内容" min-width="340" show-overflow-tooltip />
    <el-table-column label="状态" width="90" align="center">
      <template #default="{ row }">
        <el-tag :type="row.status === 0 ? 'danger' : 'info'" size="small" effect="plain">
          {{ row.status === 0 ? '未读' : '已读' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="时间" width="170">
      <template #default="{ row }">
        <span>{{ formatAlertTime(row.createdAt) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="90" align="center">
      <template #default="{ row }">
        <el-button v-if="row.status === 0" link type="primary" size="small" @click="emit('read-event', row)">
          标记已读
        </el-button>
        <span v-else class="muted">-</span>
      </template>
    </el-table-column>
  </el-table>
  <el-empty v-if="!loading && events.length === 0" description="暂无告警记录" :image-size="60" />
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
import type { AlertEvent } from '@/api/alert'
import { formatAlertTime } from '../utils/dataset-alert-utils'

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

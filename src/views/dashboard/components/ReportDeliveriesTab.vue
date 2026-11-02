<template>
  <div class="report-tab">
    <div class="report-toolbar">
      <el-button size="small" :loading="loading" @click="emit('refresh')">刷新</el-button>
      <span class="report-hint">每次定时生成的数据快照，点击「查看」预览图表数据</span>
    </div>

    <el-table v-loading="loading" :data="deliveries" size="small" border>
      <el-table-column prop="title" label="报表标题" min-width="260" show-overflow-tooltip />
      <el-table-column label="渠道" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.channel === 'webhook' ? 'warning' : 'primary'">
            {{ row.channel === 'webhook' ? 'Webhook' : '站内' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 'failed' ? 'danger' : 'success'">
            {{ row.status === 'failed' ? '失败' : '成功' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="接收" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.readFlag === 0 ? 'danger' : 'info'" effect="plain">
            {{ row.readFlag === 0 ? '未读' : '已读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="生成时间" width="170">
        <template #default="{ row }">
          <span>{{ formatTime(row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="110" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="emit('preview', row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && deliveries.length === 0"
      description="暂无投递记录"
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
import { formatTime } from '../report-utils'

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

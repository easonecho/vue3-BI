<template>
  <el-dialog v-model="visible" :title="title" width="900px" append-to-body destroy-on-close>
    <template v-if="snapshot">
      <el-descriptions :column="3" size="small" border class="snapshot-meta">
        <el-descriptions-item label="看板">{{ snapshot.dashboard.name }}</el-descriptions-item>
        <el-descriptions-item label="图表数">{{ snapshot.dashboard.chartCount }}</el-descriptions-item>
        <el-descriptions-item label="生成时间">{{
          formatTime(snapshot.generatedAt)
        }}</el-descriptions-item>
      </el-descriptions>

      <div v-for="chart in snapshot.charts" :key="chart.id" class="snapshot-chart">
        <div class="snapshot-chart__head">
          <span class="snapshot-chart__name">{{ chart.name }}</span>
          <el-tag size="small" effect="plain">{{ chart.type }}</el-tag>
          <el-tag size="small" type="info" effect="plain">{{ chart.datasetName || '-' }}</el-tag>
          <el-tag v-if="chart.truncated" size="small" type="warning">仅展示前 10 行</el-tag>
        </div>
        <el-alert
          v-if="chart.error"
          :title="`数据查询失败: ${chart.error}`"
          type="error"
          :closable="false"
          show-icon
        />
        <el-table
          v-else
          :data="chart.rows.slice(0, 10)"
          size="small"
          border
          max-height="260"
          empty-text="无数据"
        >
          <el-table-column
            v-for="col in chart.columns"
            :key="col"
            :label="col"
            min-width="120"
            show-overflow-tooltip
          >
            <template #default="{ row }">{{ cellValue(row, col) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </template>
    <el-alert
      v-else
      :title="error || '该投递记录没有可预览的报表内容'"
      type="error"
      :closable="false"
      show-icon
    />
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { ReportSnapshot } from '@/api/report'
import { cellValue, formatTime } from '../../utils/report-utils'

defineProps<{
  title: string
  error: string
  snapshot: ReportSnapshot | null
}>()

const visible = defineModel<boolean>({ required: true })
</script>

<style scoped lang="less">
.snapshot-meta {
  margin-bottom: 14px;
}

.snapshot-chart {
  margin-bottom: 18px;
}

.snapshot-chart__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.snapshot-chart__name {
  font-weight: 600;
  font-size: 13px;
}
</style>

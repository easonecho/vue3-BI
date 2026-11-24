<template>
  <div class="api-demo">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ t('apiDemoPage.title') }}</span>
          <el-button type="primary" :loading="loading" @click="loadCharts">{{
            t('apiDemoPage.refresh')
          }}</el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="charts" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" :label="t('apiDemoPage.colName')" />
        <el-table-column prop="type" :label="t('apiDemoPage.colType')" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="datasetId" :label="t('apiDemoPage.colDatasetId')" width="100" />
        <el-table-column :label="t('apiDemoPage.colActions')" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="loadData(row.id)">{{
              t('apiDemoPage.getData')
            }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">{{
              t('apiDemoPage.delete')
            }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="chartData" style="margin-top: 16px">
      <template #header>{{ t('apiDemoPage.dataPreviewHeader') }}</template>
      <pre class="json-preview">{{ JSON.stringify(chartData.slice(0, 5), null, 2) }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getChartList, getChartData, deleteChart } from '@/api/chart'
import type { Chart } from '@/api/types'

const { t } = useI18n()
const charts = ref<Chart[]>([])
const chartData = ref<Record<string, unknown>[] | null>(null)
const loading = ref(false)

async function loadCharts() {
  loading.value = true
  try {
    const res = await getChartList({ page: 1, pageSize: 20 })
    charts.value = res.data.list
    ElMessage.success(t('apiDemoPage.loadSuccess', { total: res.data.total }))
  } finally {
    loading.value = false
  }
}

async function loadData(id: number) {
  const res = await getChartData(id)
  chartData.value = res.data.list
  ElMessage.success(t('apiDemoPage.dataLoaded', { count: res.data.list.length }))
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('apiDemoPage.deleteConfirm', { id }), t('apiDemoPage.deleteTitle'), {
    type: 'warning',
  })
  await deleteChart(id)
  ElMessage.success(t('apiDemoPage.deleteSuccess'))
  loadCharts()
}

onMounted(() => {
  loadCharts()
})
</script>

<style lang="less" scoped>
.api-demo {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .json-preview {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    font-family: 'Consolas', monospace;
    font-size: 13px;
    max-height: 300px;
    overflow: auto;
  }
}
</style>

<template>
  <div class="api-demo">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>接口调用演示 - 图表管理</span>
          <el-button type="primary" :loading="loading" @click="loadCharts">刷新</el-button>
        </div>
      </template>
      <el-table :data="charts" v-loading="loading" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="datasetId" label="数据集ID" width="100" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="loadData(row.id)">获取数据</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="chartData" style="margin-top: 16px">
      <template #header>图表数据预览 (前 5 条)</template>
      <pre class="json-preview">{{ JSON.stringify(chartData.slice(0, 5), null, 2) }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getChartList, getChartData, deleteChart } from '@/api/chart'
import type { Chart } from '@/api/types'

const charts = ref<Chart[]>([])
const chartData = ref<Record<string, unknown>[] | null>(null)
const loading = ref(false)

async function loadCharts() {
  loading.value = true
  try {
    const res = await getChartList({ page: 1, pageSize: 20 })
    charts.value = res.data.list
    ElMessage.success(`加载成功，共 ${res.data.total} 条`)
  } finally {
    loading.value = false
  }
}

async function loadData(id: number) {
  const res = await getChartData(id)
  chartData.value = res.data.list
  ElMessage.success(`获取到 ${res.data.list.length} 条数据`)
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(`确定删除图表 #${id} 吗?`, '提示', { type: 'warning' })
  await deleteChart(id)
  ElMessage.success('删除成功')
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
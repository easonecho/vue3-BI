<template>
  <div class="usage-page">
    <!-- 顶部筛选 -->
    <div class="page-toolbar">
      <div class="toolbar-title">
        <el-icon><TrendCharts /></el-icon>
        <span>使用分析</span>
        <el-tag size="small" effect="plain" type="info">近 {{ days }} 天</el-tag>
      </div>
      <div class="toolbar-actions">
        <el-radio-group v-model="days" size="small" @change="loadOverview">
          <el-radio-button :value="7">7 天</el-radio-button>
          <el-radio-button :value="30">30 天</el-radio-button>
          <el-radio-button :value="90">90 天</el-radio-button>
        </el-radio-group>
        <el-button size="small" :loading="loading" @click="loadOverview">
          <el-icon><Refresh /></el-icon>&nbsp;刷新
        </el-button>
      </div>
    </div>

    <!-- 核心指标 -->
    <el-row :gutter="16" class="stat-row">
      <el-col v-for="card in statCards" :key="card.key" :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card" :body-style="{ padding: '16px' }">
          <div class="stat-card-inner">
            <div class="stat-icon" :style="{ background: card.color }">
              <el-icon :size="22"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><DataLine /></el-icon>&nbsp;打开趋势</span>
          <span class="card-sub">区间内共 {{ data?.summary.totalViews ?? 0 }} 次打开</span>
        </div>
      </template>
      <div ref="trendRef" v-loading="loading" class="trend-chart" />
    </el-card>

    <el-row :gutter="16">
      <!-- 热门看板 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataBoard /></el-icon>&nbsp;热门看板 Top 10</span>
            </div>
          </template>
          <template v-if="data?.topDashboards.length">
            <div v-for="(item, idx) in data.topDashboards" :key="idx" class="rank-item">
              <span class="rank-no" :class="`rank-no--${idx + 1}`">{{ idx + 1 }}</span>
              <div class="rank-body">
                <div class="rank-head">
                  <span class="rank-name" :title="item.dashboardName">{{ item.dashboardName }}</span>
                  <span class="rank-value">{{ item.views }} 次</span>
                </div>
                <el-progress
                  :percentage="percent(item.views)"
                  :show-text="false"
                  :stroke-width="6"
                  color="#409eff"
                />
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无看板访问数据" :image-size="70" />
        </el-card>
      </el-col>

      <!-- 活跃用户 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><UserFilled /></el-icon>&nbsp;活跃用户 Top 10</span>
            </div>
          </template>
          <el-table v-if="data?.topUsers.length" :data="data.topUsers" size="small" border>
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="username" label="用户" min-width="140" show-overflow-tooltip />
            <el-table-column prop="views" label="打开次数" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.views }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无活跃用户数据" :image-size="70" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近访问 -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><Clock /></el-icon>&nbsp;最近访问</span>
        </div>
      </template>
      <el-table v-if="data?.recent.length" :data="data.recent" size="small" border max-height="360">
        <el-table-column prop="dashboardName" label="看板" min-width="200" show-overflow-tooltip />
        <el-table-column prop="username" label="访问者" min-width="120" />
        <el-table-column label="来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === 'share' ? 'warning' : 'success'" effect="plain">
              {{ row.source === 'share' ? '公开分享' : '站内' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="访问时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无访问记录" :image-size="70" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Clock,
  DataBoard,
  DataLine,
  Refresh,
  TrendCharts,
  UserFilled,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getUsageOverview, type UsageOverview } from '@/api/usage'

const days = ref(30)
const loading = ref(false)
const data = ref<UsageOverview | null>(null)

const trendRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const statCards = computed(() => {
  const s = data.value?.summary
  return [
    { key: 'today', label: '今日打开', value: s?.todayViews ?? 0, icon: Clock, color: '#409eff' },
    {
      key: 'total',
      label: `近 ${days.value} 天打开`,
      value: s?.totalViews ?? 0,
      icon: TrendCharts,
      color: '#67c23a',
    },
    { key: 'users', label: '活跃用户', value: s?.activeUsers ?? 0, icon: UserFilled, color: '#e6a23c' },
    { key: 'dashboards', label: '覆盖看板', value: s?.coveredDashboards ?? 0, icon: DataBoard, color: '#f56c6c' },
  ]
})

/** 进度条百分比 (相对榜首) */
function percent(value: number): number {
  const max = data.value?.topDashboards[0]?.views || 1
  return Math.round((value / max) * 100)
}

function formatTime(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { hour12: false })
}

/** x 轴显示 MM-DD, tooltip 显示完整日期 */
function shortDate(date: string): string {
  return date.slice(5)
}

function renderTrend() {
  if (!trendRef.value) return
  if (!chart) chart = echarts.init(trendRef.value)
  const trend = data.value?.trend ?? []
  chart.setOption(
    {
      grid: { top: 24, right: 24, bottom: 32, left: 48 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params
          return `${p.axisValue}<br/>打开次数: <b>${p.value}</b>`
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trend.map((i) => shortDate(i.date)),
        axisLine: { lineStyle: { color: '#dcdfe6' } },
        axisLabel: { color: '#909399' },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f0f2f5' } },
        axisLabel: { color: '#909399' },
      },
      series: [
        {
          name: '打开次数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: trend.length <= 31,
          data: trend.map((i) => i.count),
          itemStyle: { color: '#409eff' },
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.28)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.02)' },
            ]),
          },
        },
      ],
    },
    true,
  )
}

async function loadOverview() {
  loading.value = true
  try {
    const res = await getUsageOverview(days.value)
    data.value = res.data
    await nextTick()
    renderTrend()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载使用分析失败')
  } finally {
    loading.value = false
  }
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  loadOverview()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped lang="less">
.usage-page {
  padding-bottom: 8px;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-info {
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.section-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
}

.card-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.trend-chart {
  height: 300px;
  width: 100%;
}

.rank-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

.rank-no {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;

  &--1 {
    background: #f56c6c;
    color: #fff;
  }
  &--2 {
    background: #e6a23c;
    color: #fff;
  }
  &--3 {
    background: #409eff;
    color: #fff;
  }
}

.rank-body {
  flex: 1;
  min-width: 0;
}

.rank-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.rank-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .page-toolbar {
    align-items: flex-start;
  }
  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }
  .trend-chart {
    height: 240px;
  }
}
</style>

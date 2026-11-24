<template>
  <div class="usage-page">
    <!-- 顶部筛选 -->
    <div class="page-toolbar">
      <div class="toolbar-title">
        <el-icon><TrendCharts /></el-icon>
        <span>{{ t('usagePage.title') }}</span>
        <el-tag size="small" effect="plain" type="info">{{
          t('usagePage.lastDays', { days })
        }}</el-tag>
      </div>
      <div class="toolbar-actions">
        <el-radio-group v-model="days" size="small" @change="loadOverview">
          <el-radio-button :value="7">{{ t('usagePage.days7') }}</el-radio-button>
          <el-radio-button :value="30">{{ t('usagePage.days30') }}</el-radio-button>
          <el-radio-button :value="90">{{ t('usagePage.days90') }}</el-radio-button>
        </el-radio-group>
        <el-button size="small" :loading="loading" @click="loadOverview">
          <el-icon><Refresh /></el-icon>&nbsp;{{ t('usagePage.refresh') }}
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
          <span
            ><el-icon><DataLine /></el-icon>&nbsp;{{ t('usagePage.trendTitle') }}</span
          >
          <span class="card-sub">{{
            t('usagePage.trendSub', { count: data?.summary.totalViews ?? 0 })
          }}</span>
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
              <span
                ><el-icon><DataBoard /></el-icon>&nbsp;{{ t('usagePage.topDashboards') }}</span
              >
            </div>
          </template>
          <template v-if="data?.topDashboards.length">
            <div v-for="(item, idx) in data.topDashboards" :key="idx" class="rank-item">
              <span class="rank-no" :class="`rank-no--${idx + 1}`">{{ idx + 1 }}</span>
              <div class="rank-body">
                <div class="rank-head">
                  <span class="rank-name" :title="item.dashboardName">{{
                    item.dashboardName
                  }}</span>
                  <span class="rank-value">{{
                    t('usagePage.viewsCount', { count: item.views })
                  }}</span>
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
          <el-empty v-else :description="t('usagePage.noDashboardViews')" :image-size="70" />
        </el-card>
      </el-col>

      <!-- 活跃用户 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><UserFilled /></el-icon>&nbsp;{{ t('usagePage.topUsers') }}</span
              >
            </div>
          </template>
          <el-table v-if="data?.topUsers.length" :data="data.topUsers" size="small" border>
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column
              prop="username"
              :label="t('usagePage.user')"
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column
              prop="views"
              :label="t('usagePage.openCount')"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.views }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else :description="t('usagePage.noActiveUsers')" :image-size="70" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近访问 -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="card-header">
          <span
            ><el-icon><Clock /></el-icon>&nbsp;{{ t('usagePage.recent') }}</span
          >
        </div>
      </template>
      <el-table v-if="data?.recent.length" :data="data.recent" size="small" border max-height="360">
        <el-table-column
          prop="dashboardName"
          :label="t('usagePage.dashboard')"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="username" :label="t('usagePage.visitor')" min-width="120" />
        <el-table-column :label="t('usagePage.source')" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.source === 'share' ? 'warning' : 'success'"
              effect="plain"
            >
              {{
                row.source === 'share' ? t('usagePage.shareSource') : t('usagePage.internalSource')
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('usagePage.visitTime')" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else :description="t('usagePage.noRecent')" :image-size="70" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Clock,
  DataBoard,
  DataLine,
  Refresh,
  TrendCharts,
  UserFilled,
} from '@element-plus/icons-vue'
import { init as echartsInit, graphic, use, type ECharts } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getUsageOverview, type UsageOverview } from '@/api/usage'

// 🔑 ECharts 按需注册（模块级执行一次）：折线图 + 直角坐标系/提示框 + Canvas 渲染器
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const { t } = useI18n()

const days = ref(30)
const loading = ref(false)
const data = ref<UsageOverview | null>(null)

const trendRef = ref<HTMLDivElement | null>(null)
let chart: ECharts | null = null

const statCards = computed(() => {
  const s = data.value?.summary
  return [
    {
      key: 'today',
      label: t('usagePage.statToday'),
      value: s?.todayViews ?? 0,
      icon: Clock,
      color: '#409eff',
    },
    {
      key: 'total',
      label: t('usagePage.statTotal', { days: days.value }),
      value: s?.totalViews ?? 0,
      icon: TrendCharts,
      color: '#67c23a',
    },
    {
      key: 'users',
      label: t('usagePage.statActiveUsers'),
      value: s?.activeUsers ?? 0,
      icon: UserFilled,
      color: '#e6a23c',
    },
    {
      key: 'dashboards',
      label: t('usagePage.statCoveredDashboards'),
      value: s?.coveredDashboards ?? 0,
      icon: DataBoard,
      color: '#f56c6c',
    },
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
  if (!chart) chart = echartsInit(trendRef.value)
  const trend = data.value?.trend ?? []
  chart.setOption(
    {
      grid: { top: 24, right: 24, bottom: 32, left: 48 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (Array.isArray(params) ? params[0] : params) as {
            axisValue?: string
            value?: number
          }
          return `${p.axisValue}<br/>${t('usagePage.openCount')}: <b>${p.value}</b>`
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
          name: t('usagePage.openCount'),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: trend.length <= 31,
          data: trend.map((i) => i.count),
          itemStyle: { color: '#409eff' },
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
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
    ElMessage.error(e instanceof Error ? e.message : t('usagePage.loadFailed'))
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

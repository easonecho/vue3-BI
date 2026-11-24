<template>
  <div class="monitor-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col v-for="card in statCards" :key="card.key" :xs="12" :sm="8" :md="6" :lg="4" :xl="3">
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

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- 在线用户 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><UserFilled /></el-icon>&nbsp;{{
                  t('monitorPage.onlineTitle', { count: onlineUsers.length })
                }}</span
              >
              <div class="header-actions">
                <el-tag type="success" size="small" effect="plain">{{
                  t('monitorPage.timeoutTag')
                }}</el-tag>
                <el-button link type="primary" :loading="loadingOnline" @click="loadOnline">
                  <el-icon><Refresh /></el-icon>&nbsp;{{ t('monitorPage.refresh') }}
                </el-button>
              </div>
            </div>
          </template>
          <el-table
            v-loading="loadingOnline"
            :data="onlineUsers"
            size="small"
            border
            max-height="420"
          >
            <el-table-column prop="userId" label="ID" width="70" align="center" />
            <el-table-column prop="username" :label="t('monitorPage.username')" min-width="120" />
            <el-table-column prop="nickname" :label="t('monitorPage.nickname')" min-width="120">
              <template #default="{ row }">{{ row.nickname || '—' }}</template>
            </el-table-column>
            <el-table-column :label="t('monitorPage.role')" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.roleId === 1 ? 'danger' : 'info'">
                  {{
                    row.roleId === 1
                      ? t('monitorPage.superAdmin')
                      : t('monitorPage.roleWithId', { id: row.roleId })
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" min-width="120" />
            <el-table-column :label="t('monitorPage.loginTime')" width="170">
              <template #default="{ row }">{{ formatTime(row.loginAt) }}</template>
            </el-table-column>
            <el-table-column :label="t('monitorPage.lastActive')" width="170">
              <template #default="{ row }">{{ formatTime(row.lastActiveAt) }}</template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-popconfirm
                  :title="t('monitorPage.kickConfirm', { name: row.username })"
                  confirm-button-type="danger"
                  @confirm="handleKick(row)"
                >
                  <template #reference>
                    <el-button v-permission="'monitor:kick'" link type="danger" size="small">{{
                      t('monitorPage.kick')
                    }}</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 进程内存 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><Cpu /></el-icon>&nbsp;{{ t('monitorPage.memTitle') }}</span
              >
              <el-button link type="primary" :loading="loadingMem" @click="loadMem">
                <el-icon><Refresh /></el-icon>&nbsp;{{ t('monitorPage.refresh') }}
              </el-button>
            </div>
          </template>
          <div v-loading="loadingMem" class="mem-list">
            <div v-for="m in memItems" :key="m.key" class="mem-item">
              <div class="mem-label">{{ m.label }}</div>
              <div class="mem-bar-wrap">
                <div class="mem-bar" :style="{ width: m.percent + '%', background: m.color }" />
              </div>
              <div class="mem-value">{{ m.value }} MB</div>
            </div>
            <el-divider />
            <div class="uptime-row">
              <span class="uptime-label">{{ t('monitorPage.uptime') }}</span>
              <span class="uptime-value">{{ uptimeText }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- HTTP 请求指标 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><TrendCharts /></el-icon>&nbsp;{{ t('monitorPage.httpMetrics') }}</span
              >
              <div class="header-actions">
                <el-tag type="info" size="small" effect="plain">{{
                  t('monitorPage.resetAfterRestart')
                }}</el-tag>
                <el-button link type="primary" :loading="loadingMetrics" @click="loadMetrics">
                  <el-icon><Refresh /></el-icon>&nbsp;{{ t('monitorPage.refresh') }}
                </el-button>
              </div>
            </div>
          </template>
          <div v-loading="loadingMetrics" class="metric-summary">
            <div class="metric-block">
              <div class="metric-value">{{ metrics?.http.total ?? 0 }}</div>
              <div class="metric-label">{{ t('monitorPage.totalRequests') }}</div>
            </div>
            <div class="metric-block">
              <div
                class="metric-value"
                :class="{ 'metric-danger': (metrics?.http.serverErrors ?? 0) > 0 }"
              >
                {{ metrics?.http.serverErrors ?? 0 }}
              </div>
              <div class="metric-label">{{ t('monitorPage.serverErrors') }}</div>
            </div>
            <div class="metric-block">
              <div class="metric-value">{{ avgDurationText }}</div>
              <div class="metric-label">{{ t('monitorPage.avgDuration') }}</div>
            </div>
          </div>
          <el-table :data="metrics?.http.topRoutes ?? []" size="small" border max-height="260">
            <el-table-column
              prop="route"
              :label="t('monitorPage.route')"
              min-width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="count"
              :label="t('monitorPage.requestCount')"
              width="100"
              align="center"
            />
            <el-table-column :label="t('monitorPage.avgDuration')" width="110" align="center">
              <template #default="{ row }">{{ row.avgDurationMs }} ms</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 异常指标 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><Warning /></el-icon>&nbsp;{{ t('monitorPage.failures') }}</span
              >
              <el-tag :type="failureTotal > 0 ? 'danger' : 'success'" size="small" effect="plain">
                {{ t('monitorPage.failureTotal', { count: failureTotal }) }}
              </el-tag>
            </div>
          </template>
          <el-table
            :data="failureRows"
            size="small"
            border
            max-height="360"
            :empty-text="t('monitorPage.noFailures')"
          >
            <el-table-column prop="type" :label="t('monitorPage.type')" width="120" />
            <el-table-column prop="dimension" :label="t('monitorPage.dimension')" min-width="180" />
            <el-table-column prop="count" :label="t('monitorPage.count')" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="danger">{{ row.count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  Refresh,
  Cpu,
  User,
  Avatar,
  DataBoard,
  Grid,
  Link,
  PieChart,
  Document,
  Setting,
  Timer,
  TrendCharts,
  Warning,
} from '@element-plus/icons-vue'
import {
  getSystemStats,
  getOnlineUsers,
  getProcessMemory,
  getRuntimeMetrics,
  forceLogout,
  type SystemStats,
  type OnlineUser,
  type ProcessMemory,
  type MetricsSnapshot,
} from '@/api/monitor'

const { t } = useI18n()

const stats = ref<SystemStats | null>(null)
const onlineUsers = ref<OnlineUser[]>([])
const mem = ref<ProcessMemory | null>(null)
const metrics = ref<MetricsSnapshot | null>(null)
const loadingOnline = ref(false)
const loadingMem = ref(false)
const loadingMetrics = ref(false)

async function loadStats() {
  try {
    const res = await getSystemStats()
    stats.value = res.data
  } catch {
    /* noop */
  }
}

async function loadOnline() {
  loadingOnline.value = true
  try {
    const res = await getOnlineUsers()
    onlineUsers.value = res.data
  } catch {
    /* noop */
  } finally {
    loadingOnline.value = false
  }
}

async function loadMem() {
  loadingMem.value = true
  try {
    const res = await getProcessMemory()
    mem.value = res.data
  } catch {
    /* noop */
  } finally {
    loadingMem.value = false
  }
}

async function loadMetrics() {
  loadingMetrics.value = true
  try {
    const res = await getRuntimeMetrics()
    metrics.value = res.data
  } catch {
    /* noop */
  } finally {
    loadingMetrics.value = false
  }
}

const avgDurationText = computed(() => `${metrics.value?.http.avgDurationMs ?? 0} ms`)

/** 异常指标合并为统一表格: 登录失败 / 导出失败 / 调度失败 */
const failureRows = computed(() => {
  const m = metrics.value
  if (!m) return []
  const rows: Array<{ key: string; type: string; dimension: string; count: number }> = []
  m.loginFailures.forEach((item) =>
    rows.push({
      key: `login-${item.code}`,
      type: t('monitorPage.loginFailed'),
      dimension: t('monitorPage.errorCode', { code: item.code }),
      count: item.count,
    }),
  )
  m.exportFailures.forEach((item) =>
    rows.push({
      key: `export-${item.type}-${item.format}`,
      type: t('monitorPage.exportFailed'),
      dimension: `${item.type} / ${item.format}`,
      count: item.count,
    }),
  )
  m.schedulerFailures.forEach((item) =>
    rows.push({
      key: `scheduler-${item.job}`,
      type: t('monitorPage.schedulerFailed'),
      dimension: item.job,
      count: item.count,
    }),
  )
  return rows.sort((a, b) => b.count - a.count)
})

const failureTotal = computed(() => failureRows.value.reduce((sum, row) => sum + row.count, 0))

const statCards = computed(() => {
  const s = stats.value
  return [
    {
      key: 'online',
      label: t('monitorPage.statOnline'),
      value: s?.onlineUsers ?? 0,
      icon: User,
      color: '#10b981',
    },
    {
      key: 'users',
      label: t('monitorPage.statUsers'),
      value: s?.users ?? 0,
      icon: UserFilled,
      color: '#3b82f6',
    },
    {
      key: 'roles',
      label: t('monitorPage.statRoles'),
      value: s?.roles ?? 0,
      icon: Avatar,
      color: '#8b5cf6',
    },
    {
      key: 'dashboards',
      label: t('monitorPage.statDashboards'),
      value: s?.dashboards ?? 0,
      icon: DataBoard,
      color: '#f59e0b',
    },
    {
      key: 'datasets',
      label: t('monitorPage.statDatasets'),
      value: s?.datasets ?? 0,
      icon: Grid,
      color: '#06b6d4',
    },
    {
      key: 'datasources',
      label: t('monitorPage.statDatasources'),
      value: s?.datasources ?? 0,
      icon: Link,
      color: '#ec4899',
    },
    {
      key: 'charts',
      label: t('monitorPage.statCharts'),
      value: s?.charts ?? 0,
      icon: PieChart,
      color: '#ef4444',
    },
    {
      key: 'positions',
      label: t('monitorPage.statPositions'),
      value: s?.positions ?? 0,
      icon: Document,
      color: '#14b8a6',
    },
    {
      key: 'tasks',
      label: t('monitorPage.statTasks'),
      value: s?.scheduledTasks ?? 0,
      icon: Timer,
      color: '#f97316',
    },
    {
      key: 'configs',
      label: t('monitorPage.statConfigs'),
      value: s?.systemConfigs ?? 0,
      icon: Setting,
      color: '#6366f1',
    },
  ]
})

const memItems = computed(() => {
  const m = mem.value
  if (!m) return []
  const max = Math.max(m.rss, m.heapTotal, 1)
  const item = (label: string, value: number, color: string) => ({
    key: label,
    label,
    value: value.toFixed(2),
    percent: Math.min(100, (value / max) * 100),
    color,
  })
  return [
    item(t('monitorPage.rss'), m.rss, '#3b82f6'),
    item('Heap Total', m.heapTotal, '#8b5cf6'),
    item('Heap Used', m.heapUsed, '#10b981'),
    item('External', m.external, '#f59e0b'),
  ]
})

const uptimeText = computed(() => {
  const s = mem.value?.uptime ?? 0
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  const parts: string[] = []
  if (days) parts.push(t('monitorPage.uptimeDays', { n: days }))
  if (hours) parts.push(t('monitorPage.uptimeHours', { n: hours }))
  if (mins) parts.push(t('monitorPage.uptimeMinutes', { n: mins }))
  parts.push(t('monitorPage.uptimeSeconds', { n: secs }))
  return parts.join(' ')
})

function formatTime(t: string) {
  return new Date(t).toLocaleString('zh-CN', { hour12: false })
}

async function handleKick(row: OnlineUser) {
  try {
    const res = await forceLogout(row.userId)
    if (res.data.kicked) {
      ElMessage.success(t('monitorPage.kicked', { name: row.username }))
    } else {
      ElMessage.warning(t('monitorPage.userOffline'))
    }
    loadOnline()
    loadStats()
  } catch {
    /* noop */
  }
}

let timer: number | undefined
onMounted(() => {
  loadStats()
  loadOnline()
  loadMem()
  loadMetrics()
  // 每 30 秒自动刷新在线用户、统计与运行指标
  timer = window.setInterval(() => {
    loadOnline()
    loadStats()
    loadMetrics()
  }, 30000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped lang="less">
.monitor-page {
  width: 100%;
}
.stat-row {
  margin-bottom: 0;
}
.stat-card {
  margin-bottom: 16px;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
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
  flex: 1;
  min-width: 0;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.mem-list {
  padding: 4px 0;
}
.mem-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  .mem-label {
    width: 90px;
    font-size: 13px;
    color: #4b5563;
    flex-shrink: 0;
  }
  .mem-bar-wrap {
    flex: 1;
    height: 10px;
    background: #f3f4f6;
    border-radius: 5px;
    overflow: hidden;
  }
  .mem-bar {
    height: 100%;
    border-radius: 5px;
    transition: width 0.4s ease;
  }
  .mem-value {
    width: 90px;
    font-size: 12px;
    color: #6b7280;
    text-align: right;
    font-family: 'Consolas', monospace;
  }
}
.uptime-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .uptime-label {
    font-size: 13px;
    color: #6b7280;
  }
  .uptime-value {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    font-family: 'Consolas', monospace;
  }
}

.metric-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  .metric-block {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    background: #f9fafb;
    text-align: center;
  }
  .metric-value {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
  }
  .metric-value.metric-danger {
    color: #ef4444;
  }
  .metric-label {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }
}
</style>

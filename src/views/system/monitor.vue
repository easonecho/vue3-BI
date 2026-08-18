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
              <span><el-icon><UserFilled /></el-icon>&nbsp;在线用户 ({{ onlineUsers.length }})</span>
              <div class="header-actions">
                <el-tag type="success" size="small" effect="plain">超时: 30 分钟</el-tag>
                <el-button link type="primary" :loading="loadingOnline" @click="loadOnline">
                  <el-icon><Refresh /></el-icon>&nbsp;刷新
                </el-button>
              </div>
            </div>
          </template>
          <el-table v-loading="loadingOnline" :data="onlineUsers" size="small" border max-height="420">
            <el-table-column prop="userId" label="ID" width="70" align="center" />
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="nickname" label="昵称" min-width="120">
              <template #default="{ row }">{{ row.nickname || '—' }}</template>
            </el-table-column>
            <el-table-column label="角色" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.roleId === 1 ? 'danger' : 'info'">
                  {{ row.roleId === 1 ? '超管' : `角色${row.roleId}` }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" min-width="120" />
            <el-table-column label="登录时间" width="170">
              <template #default="{ row }">{{ formatTime(row.loginAt) }}</template>
            </el-table-column>
            <el-table-column label="最后活动" width="170">
              <template #default="{ row }">{{ formatTime(row.lastActiveAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-popconfirm
                  :title="`确定强制踢出「${row.username}」吗？`"
                  confirm-button-type="danger"
                  @confirm="handleKick(row)"
                >
                  <template #reference>
                    <el-button v-permission="'monitor:kick'" link type="danger" size="small">踢出</el-button>
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
              <span><el-icon><Cpu /></el-icon>&nbsp;进程内存 (MB)</span>
              <el-button link type="primary" :loading="loadingMem" @click="loadMem">
                <el-icon><Refresh /></el-icon>&nbsp;刷新
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
              <span class="uptime-label">服务运行时长</span>
              <span class="uptime-value">{{ uptimeText }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  UserFilled, Refresh, Cpu, User, Avatar, DataBoard, Grid, Link,
  PieChart, Document, Setting, Timer,
} from '@element-plus/icons-vue';
import {
  getSystemStats,
  getOnlineUsers,
  getProcessMemory,
  forceLogout,
  type SystemStats,
  type OnlineUser,
  type ProcessMemory,
} from '@/api/monitor';

const stats = ref<SystemStats | null>(null);
const onlineUsers = ref<OnlineUser[]>([]);
const mem = ref<ProcessMemory | null>(null);
const loadingOnline = ref(false);
const loadingMem = ref(false);

async function loadStats() {
  try {
    const res = await getSystemStats();
    stats.value = res.data;
  } catch {
    /* noop */
  }
}

async function loadOnline() {
  loadingOnline.value = true;
  try {
    const res = await getOnlineUsers();
    onlineUsers.value = res.data;
  } catch {
    /* noop */
  } finally {
    loadingOnline.value = false;
  }
}

async function loadMem() {
  loadingMem.value = true;
  try {
    const res = await getProcessMemory();
    mem.value = res.data;
  } catch {
    /* noop */
  } finally {
    loadingMem.value = false;
  }
}

const statCards = computed(() => {
  const s = stats.value;
  return [
    { key: 'online', label: '在线用户', value: s?.onlineUsers ?? 0, icon: User, color: '#10b981' },
    { key: 'users', label: '用户总数', value: s?.users ?? 0, icon: UserFilled, color: '#3b82f6' },
    { key: 'roles', label: '角色数', value: s?.roles ?? 0, icon: Avatar, color: '#8b5cf6' },
    { key: 'dashboards', label: '仪表板', value: s?.dashboards ?? 0, icon: DataBoard, color: '#f59e0b' },
    { key: 'datasets', label: '数据集', value: s?.datasets ?? 0, icon: Grid, color: '#06b6d4' },
    { key: 'datasources', label: '数据源', value: s?.datasources ?? 0, icon: Link, color: '#ec4899' },
    { key: 'charts', label: '图表', value: s?.charts ?? 0, icon: PieChart, color: '#ef4444' },
    { key: 'positions', label: '岗位', value: s?.positions ?? 0, icon: Document, color: '#14b8a6' },
    { key: 'tasks', label: '定时任务', value: s?.scheduledTasks ?? 0, icon: Timer, color: '#f97316' },
    { key: 'configs', label: '系统配置', value: s?.systemConfigs ?? 0, icon: Setting, color: '#6366f1' },
  ];
});

const memItems = computed(() => {
  const m = mem.value;
  if (!m) return [];
  const max = Math.max(m.rss, m.heapTotal, 1);
  const item = (label: string, value: number, color: string) => ({
    key: label,
    label,
    value: value.toFixed(2),
    percent: Math.min(100, (value / max) * 100),
    color,
  });
  return [
    item('RSS (常驻内存)', m.rss, '#3b82f6'),
    item('Heap Total', m.heapTotal, '#8b5cf6'),
    item('Heap Used', m.heapUsed, '#10b981'),
    item('External', m.external, '#f59e0b'),
  ];
});

const uptimeText = computed(() => {
  const s = mem.value?.uptime ?? 0;
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}天`);
  if (hours) parts.push(`${hours}小时`);
  if (mins) parts.push(`${mins}分`);
  parts.push(`${secs}秒`);
  return parts.join(' ');
});

function formatTime(t: string) {
  return new Date(t).toLocaleString('zh-CN', { hour12: false });
}

async function handleKick(row: OnlineUser) {
  try {
    const res = await forceLogout(row.userId);
    if (res.data.kicked) {
      ElMessage.success(`已踢出用户「${row.username}」`);
    } else {
      ElMessage.warning('该用户已不在线');
    }
    loadOnline();
    loadStats();
  } catch {
    /* noop */
  }
}

let timer: number | undefined;
onMounted(() => {
  loadStats();
  loadOnline();
  loadMem();
  // 每 30 秒自动刷新在线用户和统计
  timer = window.setInterval(() => {
    loadOnline();
    loadStats();
  }, 30000);
});
onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped lang="less">
.monitor-page { width: 100%; }
.stat-row { margin-bottom: 0; }
.stat-card {
  margin-bottom: 16px;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
}
.stat-card-inner { display: flex; align-items: center; gap: 12px; }
.stat-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.stat-info { flex: 1; min-width: 0; }
.stat-value { font-size: 22px; font-weight: 700; color: #111827; line-height: 1.2; }
.stat-label { font-size: 12px; color: #6b7280; margin-top: 2px; }

.card-header {
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 600;
  .header-actions { display: flex; align-items: center; gap: 8px; }
}

.mem-list { padding: 4px 0; }
.mem-item {
  display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
  .mem-label { width: 90px; font-size: 13px; color: #4b5563; flex-shrink: 0; }
  .mem-bar-wrap {
    flex: 1; height: 10px; background: #f3f4f6; border-radius: 5px; overflow: hidden;
  }
  .mem-bar { height: 100%; border-radius: 5px; transition: width 0.4s ease; }
  .mem-value { width: 90px; font-size: 12px; color: #6b7280; text-align: right; font-family: 'Consolas', monospace; }
}
.uptime-row {
  display: flex; justify-content: space-between; align-items: center;
  .uptime-label { font-size: 13px; color: #6b7280; }
  .uptime-value { font-size: 14px; font-weight: 600; color: #111827; font-family: 'Consolas', monospace; }
}
</style>

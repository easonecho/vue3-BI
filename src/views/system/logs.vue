<template>
  <div class="log-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-select v-model="filters.module" placeholder="模块" clearable style="width: 140px" @change="handleSearch">
          <el-option v-for="m in moduleOptions" :key="m" :label="m" :value="m" />
        </el-select>
        <el-input v-model="filters.username" placeholder="操作用户" clearable style="width: 140px" @keyup.enter="handleSearch" @clear="handleSearch" />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100px" @change="handleSearch">
          <el-option label="成功" :value="200" />
          <el-option label="失败" :value="500" />
        </el-select>
        <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 380px" @change="handleSearch" />
        <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>&nbsp;查询</el-button>
        <el-button @click="handleReset"><el-icon><Refresh /></el-icon>&nbsp;重置</el-button>
        <div class="spacer" />
        <el-popconfirm title="确定清空全部操作日志？" confirm-button-type="danger" @confirm="handleCleanAll">
          <template #reference>
            <el-button v-permission="'system:log:clean'" type="danger" :disabled="!total"><el-icon><Delete /></el-icon>&nbsp;清空日志</el-button>
          </template>
        </el-popconfirm>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="操作用户" width="120" show-overflow-tooltip />
        <el-table-column prop="module" label="模块" width="110">
          <template #default="{ row }"><el-tag size="small" :type="moduleTag(row.module)">{{ row.module }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="110" show-overflow-tooltip />
        <el-table-column prop="method" label="方法" width="70" align="center">
          <template #default="{ row }"><el-tag size="small" :type="methodTag(row.method)" effect="plain">{{ row.method }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="path" label="请求路径" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status >= 200 && row.status < 300 ? 'success' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时(ms)" width="90" align="center" />
        <el-table-column prop="ip" label="IP" width="120" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="操作时间" width="170" align="center" />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" background @size-change="loadList" @current-change="loadList" />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="操作日志详情" width="700px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作用户">{{ currentLog.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ currentLog.action }}</el-descriptions-item>
        <el-descriptions-item label="HTTP方法">{{ currentLog.method }}</el-descriptions-item>
        <el-descriptions-item label="状态码">{{ currentLog.status }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.duration ? currentLog.duration + ' ms' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentLog.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{ currentLog.path }}</el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">{{ currentLog.userAgent || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ currentLog.createdAt }}</el-descriptions-item>
        <el-descriptions-item v-if="currentLog.errorMsg" label="错误信息" :span="2">
          <span style="color: #f56c6c; white-space: pre-wrap">{{ currentLog.errorMsg }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="json-preview">{{ formatJson(currentLog.params) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Delete } from '@element-plus/icons-vue';
import { getLogList, getLogModules, deleteLog, cleanAllLogs, type OperationLogItem } from '@/api/operation-log';

const loading = ref(false);
const list = ref<OperationLogItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const moduleOptions = ref<string[]>([]);
const selectedIds = ref<number[]>([]);
const filters = reactive<{ module?: string; username?: string; status?: number }>({});
const dateRange = ref<[string, string] | null>(null);

const detailVisible = ref(false);
const currentLog = ref<OperationLogItem | null>(null);

async function loadList() {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filters.module) params.module = filters.module;
    if (filters.username) params.username = filters.username;
    if (filters.status !== undefined) params.status = filters.status;
    if (dateRange.value) {
      params.startTime = dateRange.value[0];
      params.endTime = dateRange.value[1];
    }
    const res = await getLogList(params);
    list.value = res.data.list;
    total.value = res.data.total;
  } catch { /* noop */ } finally { loading.value = false; }
}

async function loadModules() {
  try { moduleOptions.value = await getLogModules().then(r => r.data); } catch { /* noop */ }
}

function handleSearch() { page.value = 1; loadList(); }
function handleReset() {
  filters.module = undefined; filters.username = undefined; filters.status = undefined;
  dateRange.value = null;
  handleSearch();
}

function handleSelectionChange(rows: OperationLogItem[]) {
  selectedIds.value = rows.map(r => r.id);
}

async function handleCleanAll() {
  try {
    const res = await cleanAllLogs();
    ElMessage.success(`已清空 ${res.data.count} 条日志`);
    loadList();
  } catch { /* noop */ }
}

function showDetail(row: OperationLogItem) {
  currentLog.value = row;
  detailVisible.value = true;
}

function formatJson(v: unknown) {
  if (!v) return '-';
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

function moduleTag(m: string) {
  const map: Record<string, string> = { auth: 'warning', user: '', role: 'success', datasource: 'info', dataset: 'info', dashboard: '', chart: '', export: 'warning', menu: 'success' };
  return (map[m] || '') as any;
}
function methodTag(m: string) {
  const map: Record<string, string> = { GET: 'info', POST: 'success', PUT: 'warning', DELETE: 'danger' };
  return (map[m] || 'info') as any;
}

onMounted(() => { loadModules(); loadList(); });
</script>

<style scoped lang="less">
.log-page { width: 100%; }
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; .spacer { flex: 1; min-width: 4px; } }
.pagination-bar { display: flex; justify-content: flex-end; padding-top: 16px; }
.json-preview { max-height: 300px; overflow: auto; background: #f5f7fa; padding: 12px; border-radius: 4px; font-size: 12px; line-height: 1.6; margin: 0; }
</style>

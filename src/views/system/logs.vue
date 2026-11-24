<template>
  <div class="log-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-select
          v-model="filters.module"
          :placeholder="t('logPage.module')"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option v-for="m in moduleOptions" :key="m" :label="m" :value="m" />
        </el-select>
        <el-input
          v-model="filters.username"
          :placeholder="t('logPage.username')"
          clearable
          style="width: 140px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.status"
          :placeholder="t('logPage.status')"
          clearable
          style="width: 100px"
          @change="handleSearch"
        >
          <el-option :label="t('logPage.successStatus')" :value="200" />
          <el-option :label="t('logPage.failedStatus')" :value="500" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          :range-separator="t('logPage.rangeSeparator')"
          :start-placeholder="t('logPage.startTime')"
          :end-placeholder="t('logPage.endTime')"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 380px"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch"
          ><el-icon><Search /></el-icon>&nbsp;{{ t('logPage.query') }}</el-button
        >
        <el-button @click="handleReset"
          ><el-icon><Refresh /></el-icon>&nbsp;{{ t('common.reset') }}</el-button
        >
        <div class="spacer" />
        <el-popconfirm
          :title="t('logPage.cleanConfirm')"
          confirm-button-type="danger"
          @confirm="handleCleanAll"
        >
          <template #reference>
            <el-button v-permission="'system:log:clean'" type="danger" :disabled="!total"
              ><el-icon><Delete /></el-icon>&nbsp;{{ t('logPage.cleanAll') }}</el-button
            >
          </template>
        </el-popconfirm>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        style="margin-top: 16px"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column
          prop="username"
          :label="t('logPage.username')"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column prop="module" :label="t('logPage.module')" width="110">
          <template #default="{ row }"
            ><el-tag size="small" :type="moduleTag(row.module)">{{ row.module }}</el-tag></template
          >
        </el-table-column>
        <el-table-column
          prop="action"
          :label="t('logPage.action')"
          width="110"
          show-overflow-tooltip
        />
        <el-table-column prop="method" :label="t('logPage.method')" width="70" align="center">
          <template #default="{ row }"
            ><el-tag size="small" :type="methodTag(row.method)" effect="plain">{{
              row.method
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column
          prop="path"
          :label="t('logPage.requestPath')"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column :label="t('logPage.status')" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.status >= 200 && row.status < 300 ? 'success' : 'danger'"
              >{{ row.status }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column
          prop="duration"
          :label="t('logPage.durationMs')"
          width="90"
          align="center"
        />
        <el-table-column prop="ip" label="IP" width="120" show-overflow-tooltip />
        <el-table-column
          prop="createdAt"
          :label="t('logPage.actionTime')"
          width="170"
          align="center"
        />
        <el-table-column :label="t('common.actions')" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">{{
              t('logPage.detail')
            }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="t('logPage.detailTitle')"
      width="700px"
      destroy-on-close
    >
      <el-descriptions v-if="currentLog" :column="2" border>
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.username')">{{
          currentLog.username || '-'
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.module')">{{
          currentLog.module
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.action')">{{
          currentLog.action
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.httpMethod')">{{
          currentLog.method
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.statusCode')">{{
          currentLog.status
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.duration')">{{
          currentLog.duration ? currentLog.duration + ' ms' : '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentLog.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.requestPath')" :span="2">{{
          currentLog.path
        }}</el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">{{
          currentLog.userAgent || '-'
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('logPage.actionTime')" :span="2">{{
          currentLog.createdAt
        }}</el-descriptions-item>
        <el-descriptions-item v-if="currentLog.errorMsg" :label="t('logPage.errorInfo')" :span="2">
          <span style="color: #f56c6c; white-space: pre-wrap">{{ currentLog.errorMsg }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('logPage.requestParams')" :span="2">
          <pre class="json-preview">{{ formatJson(currentLog.params) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import {
  getLogList,
  getLogModules,
  cleanAllLogs,
  type LogListQuery,
  type OperationLogItem,
} from '@/api/operation-log'

const { t } = useI18n()

const loading = ref(false)
const list = ref<OperationLogItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const moduleOptions = ref<string[]>([])
const selectedIds = ref<number[]>([])
const filters = reactive<{ module?: string; username?: string; status?: number }>({})
const dateRange = ref<[string, string] | null>(null)

const detailVisible = ref(false)
const currentLog = ref<OperationLogItem | null>(null)

async function loadList() {
  loading.value = true
  try {
    const params: LogListQuery = { page: page.value, pageSize: pageSize.value }
    if (filters.module) params.module = filters.module
    if (filters.username) params.username = filters.username
    if (filters.status !== undefined) params.status = filters.status
    if (dateRange.value) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await getLogList(params)
    list.value = res.data.list
    total.value = res.data.total
  } catch {
    /* noop */
  } finally {
    loading.value = false
  }
}

async function loadModules() {
  try {
    moduleOptions.value = await getLogModules().then((r) => r.data)
  } catch {
    /* noop */
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}
function handleReset() {
  filters.module = undefined
  filters.username = undefined
  filters.status = undefined
  dateRange.value = null
  handleSearch()
}

function handleSelectionChange(rows: OperationLogItem[]) {
  selectedIds.value = rows.map((r) => r.id)
}

async function handleCleanAll() {
  try {
    const res = await cleanAllLogs()
    ElMessage.success(t('logPage.cleaned', { count: res.data.count }))
    loadList()
  } catch {
    /* noop */
  }
}

function showDetail(row: OperationLogItem) {
  currentLog.value = row
  detailVisible.value = true
}

function formatJson(v: unknown) {
  if (!v) return '-'
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

/** 🔑 el-tag 的 type 合法取值（Element Plus 的联合类型），避免把 string 用 as any 传进 :type */
type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

function moduleTag(m: string): TagType | undefined {
  const map: Record<string, TagType> = {
    auth: 'warning',
    user: 'primary',
    role: 'success',
    datasource: 'info',
    dataset: 'info',
    dashboard: 'primary',
    chart: 'primary',
    export: 'warning',
    menu: 'success',
  }
  return map[m]
}
function methodTag(m: string): TagType {
  const map: Record<string, TagType> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger',
  }
  return map[m] ?? 'info'
}

onMounted(() => {
  loadModules()
  loadList()
})
</script>

<style scoped lang="less">
.log-page {
  width: 100%;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  .spacer {
    flex: 1;
    min-width: 4px;
  }
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
.json-preview {
  max-height: 300px;
  overflow: auto;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
}
</style>

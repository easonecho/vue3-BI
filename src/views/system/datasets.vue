<template>
  <div class="dataset-manage-page">
    <el-card class="page-card" shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索数据集名称/描述"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.datasourceId"
          placeholder="按数据源筛选"
          filterable
          clearable
          style="width: 200px"
          @change="handleSearch"
        >
          <el-option
            v-for="d in dsOptions"
            :key="d.id"
            :label="`${d.name} (${d.type?.toUpperCase()})`"
            :value="d.id"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;重置
        </el-button>
        <div class="spacer" />
        <el-button plain @click="lineageVisible = true">
          <el-icon><Connection /></el-icon>&nbsp;数据血缘
        </el-button>
        <el-button type="warning" plain @click="openUploadDialog">
          <el-icon><Upload /></el-icon>&nbsp;上传 Excel/CSV
        </el-button>
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;新增数据集
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'file'" size="small" type="warning">文件</el-tag>
            <el-tag v-else size="small" type="primary" effect="plain">SQL</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据源" min-width="140">
          <template #default="{ row }">
            <span v-if="row.datasource">
              <el-tag size="small" effect="plain">{{ row.datasource.type?.toUpperCase() }}</el-tag>
              &nbsp;{{ row.datasource.name }}
            </span>
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="参数" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.params && row.params.length" size="small" type="warning"
              >{{ row.params.length }}个</el-tag
            >
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="字段配置" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.fields && row.fields.length" size="small" type="success"
              >{{ row.fields.length }}个</el-tag
            >
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="缓存" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.cacheEnabled" size="small" type="success"
              >TTL {{ row.cacheTtl || 300 }}s</el-tag
            >
            <el-tag v-else size="small" type="info">未开启</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SQL / 数据文件" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.type === 'file'">
              <code class="sql-code"
                >{{ row.fileData?.fileName || '-' }} ({{ row.fileData?.rowCount ?? 0 }} 行)</code
              >
            </template>
            <code v-else class="sql-code">{{ row.sql }}</code>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="previewRow(row)">预览</el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button link type="primary" size="small" @click="openRowPermissions(row)"
              >行级权限</el-button
            >
            <el-button link type="primary" size="small" @click="openColumnPermissions(row)"
              >列级权限</el-button
            >
            <el-button link type="primary" size="small" @click="openAlerts(row)">告警</el-button>
            <el-dropdown
              trigger="click"
              @command="(cmd: string) => handleExport(row, cmd as ExportFormat)"
            >
              <el-button link type="primary" size="small">
                导出<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv">CSV</el-dropdown-item>
                  <el-dropdown-item command="xlsx">Excel (.xlsx)</el-dropdown-item>
                  <el-dropdown-item command="json">JSON</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-popconfirm
              title="确定删除该数据集吗?"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference
                ><el-button link type="danger" size="small">删除</el-button></template
              >
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <DatasetEditDialog
      v-model="editVisible"
      :mode="editMode"
      :dataset="editDataset"
      :ds-options="dsOptions"
      :preview-columns="previewData.columns"
      :preview-rows="previewData.rows"
      @saved="loadList"
      @preview-dataset="previewDatasetById"
      @preview-sql="previewSqlAdHoc"
    />

    <!-- 上传 Excel/CSV 数据集对话框 -->
    <DatasetUploadDialog v-model="uploadVisible" @created="handleSearch" />

    <!-- 行级权限管理 -->
    <DatasetRowPermissions
      v-model="rowPermissionVisible"
      :dataset="rowPermissionDataset"
      @saved="loadList"
    />

    <!-- 列级权限管理 -->
    <DatasetColumnPermissions
      v-model="columnPermissionVisible"
      :dataset="columnPermissionDataset"
      @saved="loadList"
    />

    <!-- 告警订阅管理 -->
    <DatasetAlerts v-model="alertVisible" :dataset="alertDataset" />

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="数据预览 (最多 100 行)" width="720px">
      <div v-loading="previewLoading" style="max-height: 420px; overflow: auto">
        <el-table
          v-if="previewData.rows && previewData.rows.length"
          :data="previewData.rows"
          size="small"
          stripe
          border
        >
          <el-table-column
            v-for="col in previewData.columns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="130"
            show-overflow-tooltip
          />
        </el-table>
        <el-empty v-else-if="!previewLoading" description="查询结果为空" />
      </div>
      <div style="margin-top: 8px; color: #6b7280; font-size: 13px">
        总行数: {{ previewData.rowCount ?? '-' }}
      </div>
    </el-dialog>

    <!-- 数据血缘 (P2-3) -->
    <DataLineage v-model="lineageVisible" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus, Upload, ArrowDown, Connection } from '@element-plus/icons-vue'
import DataLineage from './components/DataLineage.vue'
import DatasetEditDialog from './components/DatasetEditDialog.vue'
import DatasetUploadDialog from './components/DatasetUploadDialog.vue'
import { getDatasetList, deleteDataset, executeDataset, previewSql } from '@/api/dataset'
import type { DataSource } from '@/api/types'
import { getDataSourceList } from '@/api/datasource'
import { exportDatasetByFormat, saveAs, type ExportFormat } from '@/api/export'
import DatasetRowPermissions from './components/DatasetRowPermissions.vue'
import DatasetColumnPermissions from './components/DatasetColumnPermissions.vue'
import DatasetAlerts from './components/DatasetAlerts.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive<{ keyword?: string; datasourceId?: number }>({
  keyword: '',
  datasourceId: undefined,
})
const dsOptions = ref<DataSource[]>([])

async function loadDsOptions() {
  try {
    const res = await getDataSourceList({ page: 1, pageSize: 100 })
    dsOptions.value = res.data.list || []
  } catch {
    /* noop */
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await getDatasetList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
      datasourceId: filters.datasourceId,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}
function handleReset() {
  filters.keyword = ''
  filters.datasourceId = undefined
  handleSearch()
}

// ---------- 新增/编辑对话框 ----------
const editVisible = ref(false)
const editMode = ref<'create' | 'edit'>('create')
const editDataset = ref<any>(null)
const lineageVisible = ref(false)

function openCreateDialog() {
  editMode.value = 'create'
  editDataset.value = null
  editVisible.value = true
}
function openEditDialog(row: any) {
  editMode.value = 'edit'
  editDataset.value = row
  editVisible.value = true
}

// ---------- 上传 Excel/CSV 数据集 ----------
const uploadVisible = ref(false)

function openUploadDialog() {
  uploadVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await deleteDataset(row.id)
    ElMessage.success('删除成功')
    if (list.value.length === 1 && page.value > 1) page.value -= 1
    loadList()
  } catch {
    /* noop */
  }
}

// ---------- 行级权限 ----------
const rowPermissionVisible = ref(false)
const rowPermissionDataset = ref<{ id: number; name: string } | null>(null)

function openRowPermissions(row: any) {
  rowPermissionDataset.value = { id: row.id, name: row.name }
  rowPermissionVisible.value = true
}

// ---------- 列级权限 ----------
const columnPermissionVisible = ref(false)
const columnPermissionDataset = ref<{ id: number; name: string; fields?: unknown } | null>(null)

function openColumnPermissions(row: any) {
  columnPermissionDataset.value = { id: row.id, name: row.name, fields: row.fields }
  columnPermissionVisible.value = true
}

// ---------- 告警订阅 ----------
const alertVisible = ref(false)
const alertDataset = ref<{ id: number; name: string } | null>(null)

function openAlerts(row: any) {
  alertDataset.value = { id: row.id, name: row.name }
  alertVisible.value = true
}

// ---------- 导出 ----------
function dateStamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

async function handleExport(row: any, format: ExportFormat) {
  try {
    const blob = await exportDatasetByFormat(row.id, format, { filename: row.name })
    const safeName = String(row.name || 'dataset').replace(/[\\/:*?"<>|]/g, '_')
    saveAs(blob, `${safeName}_${dateStamp()}.${format}`)
    ElMessage.success('导出已开始')
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}

// ---------- preview ----------
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<{ columns: string[]; rows: any[]; rowCount: number }>({
  columns: [],
  rows: [],
  rowCount: 0,
})

/** 按数据集 ID 预览 (列表行 / 编辑对话框内的文件数据集) */
async function previewDatasetById(id: number) {
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = { columns: [], rows: [], rowCount: 0 }
  try {
    const res = await executeDataset(id, { limit: 100 })
    previewData.value = res.data || { columns: [], rows: [], rowCount: 0 }
  } finally {
    previewLoading.value = false
  }
}

function previewRow(row: any) {
  previewDatasetById(row.id)
}

/** 编辑对话框内「校验 SQL 并预览」 */
async function previewSqlAdHoc(params: { datasourceId: number; sql: string }) {
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = { columns: [], rows: [], rowCount: 0 }
  try {
    const res = await previewSql({ ...params, limit: 100 })
    previewData.value = res.data || { columns: [], rows: [], rowCount: 0 }
    ElMessage.success('SQL 校验通过')
  } finally {
    previewLoading.value = false
  }
}

onMounted(async () => {
  await loadDsOptions()
  await loadList()
})
</script>

<style scoped lang="less">
.dataset-manage-page {
  width: 100%;
}
.page-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
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
.sql-code {
  display: block;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  background: #f9fafb;
  padding: 4px 6px;
  border-radius: 4px;
  color: #111827;
  line-height: 1.5;
  max-height: 72px;
  overflow: hidden;
}
</style>

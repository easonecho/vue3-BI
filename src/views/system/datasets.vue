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
          <el-option v-for="d in dsOptions" :key="d.id" :label="`${d.name} (${d.type?.toUpperCase()})`" :value="d.id" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;重置
        </el-button>
        <div class="spacer" />
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;新增数据集
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="数据源" min-width="140">
          <template #default="{ row }">
            <span v-if="row.datasource">
              <el-tag size="small" effect="plain">{{ row.datasource.type?.toUpperCase() }}</el-tag>
              &nbsp;{{ row.datasource.name }}
            </span>
            <span v-else style="color:#9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="参数" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.params && row.params.length" size="small" type="warning">{{ row.params.length }}个</el-tag>
            <span v-else style="color:#9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="字段配置" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.fields && row.fields.length" size="small" type="success">{{ row.fields.length }}个</el-tag>
            <span v-else style="color:#9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="缓存" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.cacheEnabled" size="small" type="success">TTL {{ row.cacheTtl || 300 }}s</el-tag>
            <el-tag v-else size="small" type="info">未开启</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SQL" min-width="280" show-overflow-tooltip>
          <template #default="{ row }"><code class="sql-code">{{ row.sql }}</code></template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="previewRow(row)">预览</el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该数据集吗?" confirm-button-type="danger" @confirm="handleDelete(row)">
              <template #reference><el-button link type="danger" size="small">删除</el-button></template>
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
    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增数据集' : '编辑数据集'" width="780px" destroy-on-close>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本配置" name="basic">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
            <el-form-item label="数据集名称" prop="name">
              <el-input v-model="form.name" maxlength="100" placeholder="业务显示名" />
            </el-form-item>
            <el-form-item label="关联数据源" prop="datasourceId">
              <el-select v-model="form.datasourceId" filterable placeholder="选择数据源" style="width:100%">
                <el-option v-for="d in dsOptions" :key="d.id" :label="`${d.name} (${d.type?.toUpperCase()})`" :value="d.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="缓存开关" prop="cacheEnabled">
              <el-switch v-model="form.cacheEnabled" />
              <span style="margin-left: 12px; color:#6b7280; font-size: 13px">启用后相同查询在 TTL 内走内存缓存</span>
            </el-form-item>
            <el-form-item label="缓存 TTL" prop="cacheTtl">
              <el-input-number v-model="form.cacheTtl" :min="0" :max="86400" controls-position="right" style="width:200px" />
              <span v-pre style="margin-left: 12px; color:#6b7280; font-size:13px">秒</span>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" :rows="2" maxlength="500" show-word-limit />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="SQL 查询" name="sql">
          <el-form :model="form" label-width="96px">
            <el-form-item label="SQL 查询" prop="sql">
              <SqlEditor
                v-model="form.sql"
                :height="240"
                label="SQL"
                placeholder="SELECT col1, col2 FROM table_name WHERE col = {{paramName}} ..."
              />
              <div v-pre style="color:#9ca3af; font-size:12px; margin-top:4px">
                仅允许 SELECT 查询。使用 {{paramName}} 引用参数（在"参数配置"标签页定义）。
              </div>
            </el-form-item>
          </el-form>
          <el-button :disabled="!(form.datasourceId && form.sql)" @click="previewCurrentForm">
            校验 SQL 并预览
          </el-button>
        </el-tab-pane>

        <el-tab-pane :label="`参数配置${form.params && form.params.length ? ' (' + form.params.length + ')' : ''}`" name="params">
          <div style="margin-bottom: 12px">
            <el-button type="primary" size="small" @click="addParam">
              <el-icon><Plus /></el-icon>&nbsp;新增参数
            </el-button>
            <span v-pre style="margin-left: 12px; color:#6b7280; font-size:13px">
              在 SQL 中使用 {{paramName}} 引用参数, 执行时动态替换
            </span>
          </div>
          <el-table :data="form.params || []" size="small" border>
            <el-table-column label="参数名" width="140">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" placeholder="如: startDate" />
              </template>
            </el-table-column>
            <el-table-column label="标签" width="120">
              <template #default="{ row }">
                <el-input v-model="row.label" size="small" placeholder="显示名" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                <el-select v-model="row.type" size="small" style="width:100%">
                  <el-option label="字符串" value="string" />
                  <el-option label="数字" value="number" />
                  <el-option label="日期" value="date" />
                  <el-option label="日期时间" value="datetime" />
                  <el-option label="布尔" value="boolean" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="默认值" width="140">
              <template #default="{ row }">
                <el-input v-model="row.defaultValue" size="small" placeholder="可选" />
              </template>
            </el-table-column>
            <el-table-column label="必填" width="80" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.required" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="removeParam($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!form.params || form.params.length === 0" description="暂无参数, 点击上方新增" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane :label="`字段管理${form.fields && form.fields.length ? ' (' + form.fields.length + ')' : ''}`" name="fields">
          <div style="margin-bottom: 12px">
            <el-button type="primary" size="small" @click="addField">
              <el-icon><Plus /></el-icon>&nbsp;新增字段
            </el-button>
            <el-button size="small" @click="autoDetectFields" :disabled="!previewData.columns.length">
              从预览结果自动检测
            </el-button>
            <span v-pre style="margin-left: 12px; color:#6b7280; font-size:13px">
              配置字段别名、类型转换、计算字段
            </span>
          </div>
          <el-table :data="form.fields || []" size="small" border>
            <el-table-column label="字段名" width="140">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" placeholder="如: price" />
              </template>
            </el-table-column>
            <el-table-column label="别名" width="120">
              <template #default="{ row }">
                <el-input v-model="row.alias" size="small" placeholder="显示名" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="110">
              <template #default="{ row }">
                <el-select v-model="row.type" size="small" clearable style="width:100%">
                  <el-option label="字符串" value="string" />
                  <el-option label="数字" value="number" />
                  <el-option label="日期" value="date" />
                  <el-option label="日期时间" value="datetime" />
                  <el-option label="布尔" value="boolean" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="可见" width="70" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.visible" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="计算字段" width="90" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.computed" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="表达式" min-width="160">
              <template #default="{ row }">
                <el-input
                  v-model="row.expression"
                  size="small"
                  :disabled="!row.computed"
                  placeholder="如: {{price}} * {{quantity}}"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="removeField($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!form.fields || form.fields.length === 0" description="暂无字段配置, 可从预览结果自动检测" :image-size="60" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="数据预览 (最多 100 行)" width="720px">
      <div v-loading="previewLoading" style="max-height: 420px; overflow: auto">
        <el-table v-if="previewData.rows && previewData.rows.length" :data="previewData.rows" size="small" stripe border>
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
      <div style="margin-top:8px; color:#6b7280; font-size:13px">总行数: {{ previewData.rowCount ?? '-' }}</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  type CreateDatasetParams,
  type DatasetParam,
  type DatasetField,
  getDatasetList, createDataset, updateDataset, deleteDataset, executeDataset, previewSql,
} from '@/api/dataset'
import type { Dataset, DataSource } from '@/api/types'
import { getDataSourceList } from '@/api/datasource'
import SqlEditor from '@/components/SqlEditor.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive<{ keyword?: string; datasourceId?: number }>({ keyword: '', datasourceId: undefined })
const dsOptions = ref<DataSource[]>([])

async function loadDsOptions() {
  try {
    const res = await getDataSourceList({ page: 1, pageSize: 999 })
    dsOptions.value = res.data.list || []
  } catch { /* noop */ }
}

async function loadList() {
  loading.value = true
  try {
    const res = await getDatasetList({
      page: page.value, pageSize: pageSize.value,
      keyword: filters.keyword || undefined, datasourceId: filters.datasourceId,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

function handleSearch() { page.value = 1; loadList() }
function handleReset() { filters.keyword = ''; filters.datasourceId = undefined; handleSearch() }

// ---------- dialog ----------
const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const activeTab = ref('basic')

const form = reactive<CreateDatasetParams & { id?: number }>({
  id: undefined, name: '', datasourceId: 0, sql: '',
  cacheEnabled: false, cacheTtl: 300, description: '',
  fields: [], params: [],
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }, { max: 100, trigger: 'blur' }],
  datasourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  sql: [{ required: true, message: '请输入 SQL', trigger: 'blur' }],
  cacheTtl: [{ type: 'number', min: 0, max: 86400, message: 'TTL 需在 0-86400 秒', trigger: 'blur' }],
}

function openCreateDialog() {
  mode.value = 'create'
  activeTab.value = 'basic'
  Object.assign(form, {
    id: undefined, name: '', datasourceId: dsOptions.value[0]?.id ?? 0, sql: '',
    cacheEnabled: false, cacheTtl: 300, description: '',
    fields: [], params: [],
  })
  dialogVisible.value = true
}
function openEditDialog(row: Dataset & any) {
  mode.value = 'edit'
  activeTab.value = 'basic'
  Object.assign(form, {
    id: row.id, name: row.name, datasourceId: row.datasourceId, sql: row.sql,
    cacheEnabled: !!row.cacheEnabled, cacheTtl: row.cacheTtl ?? 300,
    description: row.description ?? '',
    fields: Array.isArray(row.fields) ? [...row.fields] : [],
    params: Array.isArray(row.params) ? [...row.params] : [],
  })
  dialogVisible.value = true
}

// ---------- 参数配置 ----------
function addParam() {
  if (!form.params) form.params = []
  form.params.push({ name: '', label: '', type: 'string', defaultValue: '', required: false })
}
function removeParam(idx: number) {
  form.params?.splice(idx, 1)
}

// ---------- 字段管理 ----------
function addField() {
  if (!form.fields) form.fields = []
  form.fields.push({ name: '', alias: '', type: 'string', visible: true, computed: false, expression: '' })
}
function removeField(idx: number) {
  form.fields?.splice(idx, 1)
}
function autoDetectFields() {
  if (!previewData.value.columns.length) return
  if (!form.fields) form.fields = []
  const existingNames = form.fields.map((f) => f.name)
  for (const col of previewData.value.columns) {
    if (!existingNames.includes(col)) {
      form.fields.push({ name: col, alias: '', type: 'string', visible: true, computed: false })
    }
  }
  ElMessage.success(`已添加 ${previewData.value.columns.length} 个字段`)
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) {
    activeTab.value = 'basic'
    return
  }
  if (!form.sql) {
    activeTab.value = 'sql'
    ElMessage.warning('请输入 SQL')
    return
  }
  submitting.value = true
  try {
    const payload: CreateDatasetParams = {
      name: form.name, datasourceId: form.datasourceId, sql: form.sql,
      description: form.description, cacheEnabled: form.cacheEnabled, cacheTtl: form.cacheTtl,
      fields: (form.fields && form.fields.length) ? form.fields : undefined,
      params: (form.params && form.params.length) ? form.params : undefined,
    }
    if (mode.value === 'create') {
      await createDataset(payload)
      ElMessage.success('创建数据集成功')
    } else if (form.id) {
      await updateDataset(form.id, payload)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadList()
  } finally { submitting.value = false }
}

async function handleDelete(row: any) {
  try {
    await deleteDataset(row.id)
    ElMessage.success('删除成功')
    if (list.value.length === 1 && page.value > 1) page.value -= 1
    loadList()
  } catch { /* noop */ }
}

// ---------- preview ----------
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<{ columns: string[]; rows: any[]; rowCount: number }>({ columns: [], rows: [], rowCount: 0 })

async function previewRow(row: any) {
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = { columns: [], rows: [], rowCount: 0 }
  try {
    const res = await executeDataset(row.id)
    previewData.value = res.data || { columns: [], rows: [], rowCount: 0 }
  } finally { previewLoading.value = false }
}

async function previewCurrentForm() {
  if (!form.datasourceId || !form.sql) return
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = { columns: [], rows: [], rowCount: 0 }
  try {
    const res = await previewSql({ datasourceId: form.datasourceId, sql: form.sql, limit: 100 })
    previewData.value = res.data || { columns: [], rows: [], rowCount: 0 }
    ElMessage.success('SQL 校验通过')
  } finally { previewLoading.value = false }
}

onMounted(async () => {
  await loadDsOptions()
  if (!form.datasourceId && dsOptions.value[0]) form.datasourceId = dsOptions.value[0].id
  await loadList()
})
</script>

<style scoped lang="less">
.dataset-manage-page { width: 100%; }
.page-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.filter-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  .spacer { flex: 1; min-width: 4px; }
}
.pagination-bar { display: flex; justify-content: flex-end; padding-top: 16px; }
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

<template>
  <div class="ds-manage-page">
    <el-card class="page-card" shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索数据源名称"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.type"
          placeholder="按类型筛选"
          clearable
          style="width: 160px"
          @change="handleSearch"
        >
          <el-option label="MySQL" value="mysql" />
          <el-option label="PostgreSQL" value="postgresql" />
          <el-option label="SQLite" value="sqlite" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;重置
        </el-button>
        <div class="spacer" />
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;新增数据源
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTag(row.type)">
              {{ (row.type || '').toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="连接信息" min-width="220">
          <template #default="{ row }">{{ row.username }}@{{ row.host }}:{{ row.port }}/{{ row.database }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openSchemaDialog(row)">Schema浏览</el-button>
            <el-button link type="primary" size="small" @click="testConn(row)">测试连接</el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该数据源吗?" confirm-button-type="danger" @confirm="handleDelete(row)">
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

    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增数据源' : '编辑数据源'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="form.name" maxlength="100" placeholder="便于识别的显示名" />
        </el-form-item>
        <el-form-item label="数据源类型" prop="type">
          <el-select v-model="form.type" style="width: 100%" placeholder="请选择数据库类型">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="SQLite (占位, 后续支持)" value="sqlite" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机" prop="host"><el-input v-model="form.host" placeholder="127.0.0.1" /></el-form-item>
        <el-form-item label="端口" prop="port"><el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="用户名" prop="username"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="创建必填, 编辑留空则不修改" />
        </el-form-item>
        <el-form-item label="数据库名" prop="database"><el-input v-model="form.database" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testCurrent">测试连接</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- Schema 浏览器弹窗 -->
    <el-dialog
      v-model="schemaDialogVisible"
      :title="`Schema 浏览 - ${schemaRow?.name || ''}`"
      width="720px"
      destroy-on-close
      class="schema-dialog"
    >
      <div v-loading="schemaLoading" class="schema-body">
        <div v-if="schemaError" class="schema-error">
          <el-empty :description="schemaError" />
        </div>
        <div v-else-if="schemaData">
          <div class="schema-meta">
            <el-tag type="info">数据库: {{ schemaData.database }}</el-tag>
            <el-tag type="success">表数量: {{ schemaData.tableCount }}</el-tag>
          </div>
          <el-input
            v-model="schemaFilter"
            placeholder="搜索表名或字段名"
            clearable
            :prefix-icon="Search"
            style="margin: 12px 0"
          />
          <el-tree
            ref="schemaTreeRef"
            :data="schemaTreeData"
            :props="treeProps"
            :filter-node-method="filterSchemaNode"
            node-key="id"
            default-expand-all
            class="schema-tree"
          >
            <template #default="{ node, data: nodeData }">
              <span class="schema-tree-node">
                <el-icon v-if="nodeData.type === 'table'"><Coin /></el-icon>
                <el-icon v-else><Document /></el-icon>
                <span class="schema-tree-label">{{ node.label }}</span>
                <el-tag
                  v-if="nodeData.type === 'field'"
                  size="small"
                  :type="fieldTagType(nodeData.field)"
                  class="schema-tree-tag"
                >
                  {{ nodeData.field.type }}
                </el-tag>
                <el-tag
                  v-if="nodeData.type === 'field' && nodeData.field.key === 'PRI'"
                  size="small"
                  type="warning"
                  class="schema-tree-tag"
                >
                  主键
                </el-tag>
                <el-tag
                  v-if="nodeData.type === 'field' && !nodeData.field.nullable"
                  size="small"
                  type="danger"
                  class="schema-tree-tag"
                >
                  NOT NULL
                </el-tag>
                <span
                  v-if="nodeData.type === 'field' && nodeData.field.comment"
                  class="schema-tree-comment"
                >
                  {{ nodeData.field.comment }}
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
      <template #footer>
        <el-button @click="schemaDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="schemaLoading" @click="loadSchema">刷新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, Coin, Document } from '@element-plus/icons-vue'
import {
  type CreateDataSourceParams,
  type DataSourceSchema,
  type TableField,
  getDataSourceList, createDataSource, updateDataSource, deleteDataSource, testDataSource,
  getDataSourceSchema,
} from '@/api/datasource'
import type { DataSource } from '@/api/types'

function typeTag(t?: string) {
  if (!t) return 'info' as const
  if (t === 'mysql') return 'primary'
  if (t === 'postgresql') return 'success'
  return 'info'
}

const loading = ref(false)
const list = ref<DataSource[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive<{ keyword?: string; type?: string }>({ keyword: '', type: undefined })

async function loadList() {
  loading.value = true
  try {
    const res = await getDataSourceList({ page: page.value, pageSize: pageSize.value, keyword: filters.keyword || undefined, type: filters.type })
    list.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}
function handleSearch() { page.value = 1; loadList() }
function handleReset() { filters.keyword = ''; filters.type = undefined; handleSearch() }

// ---------- dialog ----------
const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<CreateDataSourceParams & { id?: number }>({
  id: undefined, name: '', type: 'mysql', host: '127.0.0.1', port: 3306,
  username: '', password: '', database: '', description: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }, { max: 100, trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  database: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
}

function openCreateDialog() {
  mode.value = 'create'
  Object.assign(form, { id: undefined, name: '', type: 'mysql', host: '127.0.0.1', port: 3306, username: '', password: '', database: '', description: '' })
  dialogVisible.value = true
}
function openEditDialog(row: DataSource) {
  mode.value = 'edit'
  Object.assign(form, {
    id: row.id, name: row.name, type: (row.type as any) ?? 'mysql',
    host: row.host, port: row.port, username: row.username,
    password: '', database: row.database,
    description: row.description ?? '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (mode.value === 'create') {
      await createDataSource(form)
      ElMessage.success('创建数据源成功')
    } else if (form.id) {
      const payload: Partial<DataSource> & { password?: string } = {
        name: form.name, type: form.type, host: form.host, port: form.port,
        username: form.username, database: form.database, description: form.description,
      }
      if (form.password) payload.password = form.password
      await updateDataSource(form.id, payload)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadList()
  } finally { submitting.value = false }
}

async function testConn(row: DataSource) {
  try {
    await testDataSource(row.id)
    ElMessage.success('连接正常')
  } catch { /* noop */ }
}
async function testCurrent() {
  try {
    if (!formRef.value) return
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请先完善连接参数')
    return
  }
  ElMessage.info('新增数据源后点击列表中的"测试连接"按钮验证 (服务端校验)')
}

async function handleDelete(row: DataSource) {
  try {
    await deleteDataSource(row.id)
    ElMessage.success('删除成功')
    if (list.value.length === 1 && page.value > 1) page.value -= 1
    loadList()
  } catch { /* noop */ }
}

// ---------- Schema 浏览器 ----------
const schemaDialogVisible = ref(false)
const schemaLoading = ref(false)
const schemaRow = ref<DataSource | null>(null)
const schemaData = ref<DataSourceSchema | null>(null)
const schemaError = ref('')
const schemaFilter = ref('')
const schemaTreeRef = ref()

const treeProps = { label: 'label', children: 'children' }

interface SchemaTreeNode {
  id: string
  label: string
  type: 'table' | 'field'
  field?: TableField
  children?: SchemaTreeNode[]
}

const schemaTreeData = computed<SchemaTreeNode[]>(() => {
  if (!schemaData.value) return []
  return schemaData.value.tables.map((t) => ({
    id: `table-${t.name}`,
    label: t.name,
    type: 'table' as const,
    children: t.fields.map((f) => ({
      id: `field-${t.name}-${f.name}`,
      label: f.name,
      type: 'field' as const,
      field: f,
    })),
  }))
})

watch(schemaFilter, (val) => {
  schemaTreeRef.value?.filter(val)
})

function filterSchemaNode(value: string, data: SchemaTreeNode) {
  if (!value) return true
  const kw = value.toLowerCase()
  if (data.type === 'table') {
    return data.label.toLowerCase().includes(kw) ||
      (data.children || []).some((f) => f.label.toLowerCase().includes(kw))
  }
  return data.label.toLowerCase().includes(kw)
}

function fieldTagType(field: TableField) {
  const t = field.type.toLowerCase()
  if (t.includes('int') || t.includes('decimal') || t.includes('float') || t.includes('double')) return 'success'
  if (t.includes('date') || t.includes('time')) return 'warning'
  if (t.includes('text') || t.includes('json')) return 'info'
  return '' as const
}

async function loadSchema() {
  if (!schemaRow.value) return
  schemaLoading.value = true
  schemaError.value = ''
  try {
    const res = await getDataSourceSchema(schemaRow.value.id)
    schemaData.value = res.data
  } catch (e: any) {
    schemaError.value = e?.message || '加载 Schema 失败'
    schemaData.value = null
  } finally {
    schemaLoading.value = false
  }
}

function openSchemaDialog(row: DataSource) {
  schemaRow.value = row
  schemaData.value = null
  schemaFilter.value = ''
  schemaDialogVisible.value = true
  loadSchema()
}

onMounted(loadList)
</script>

<style scoped lang="less">
.ds-manage-page { width: 100%; }
.page-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.filter-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  .spacer { flex: 1; min-width: 4px; }
}
.pagination-bar { display: flex; justify-content: flex-end; padding-top: 16px; }

.schema-dialog {
  .schema-body { min-height: 300px; max-height: 60vh; overflow-y: auto; }
  .schema-meta { display: flex; gap: 12px; }
  .schema-tree {
    margin-top: 8px;
    .schema-tree-node {
      display: inline-flex; align-items: center; gap: 6px;
      .schema-tree-label { font-weight: 500; }
      .schema-tree-tag { margin-left: 4px; }
      .schema-tree-comment { color: #9ca3af; font-size: 12px; margin-left: 8px; }
    }
  }
  .schema-error { padding: 40px 0; }
}
</style>

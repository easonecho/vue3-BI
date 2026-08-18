<template>
  <div class="dept-manage-page">
    <el-card class="page-card" shadow="never">
      <div class="filter-bar">
        <el-radio-group v-model="viewMode" style="margin-right: 12px">
          <el-radio-button value="flat">扁平列表</el-radio-button>
          <el-radio-button value="tree">树形视图</el-radio-button>
        </el-radio-group>
        <el-input
          v-model="filters.keyword"
          placeholder="搜索部门名/编码"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.status"
          placeholder="按状态筛选"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;重置
        </el-button>
        <div class="spacer" />
        <el-button type="success" @click="openCreateDialog()">
          <el-icon><Plus /></el-icon>&nbsp;新增部门
        </el-button>
      </div>

      <!-- 扁平视图 -->
      <template v-if="viewMode === 'flat'">
        <el-table v-loading="loading" :data="flatList" style="margin-top: 16px" stripe border row-key="id">
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column prop="name" label="部门名称" min-width="140" />
          <el-table-column prop="code" label="编码" width="120" />
          <el-table-column label="上级部门" min-width="120">
            <template #default="{ row }">
              <span v-if="row.parent">{{ row.parent.name }}</span>
              <span v-else style="color:#9ca3af">顶级</span>
            </template>
          </el-table-column>
          <el-table-column label="负责人" width="130">
            <template #default="{ row }">
              {{ row.leader?.nickname || row.leader?.username || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="子部门" width="90" align="center">
            <template #default="{ row }">{{ row._count?.children ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="成员数" width="90" align="center">
            <template #default="{ row }">{{ row._count?.users ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openCreateDialog(row.id)">
                加子部门
              </el-button>
              <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-popconfirm title="确定删除该部门吗?" confirm-button-type="danger" @confirm="handleDelete(row)">
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
            @size-change="loadFlatList"
            @current-change="loadFlatList"
          />
        </div>
      </template>

      <!-- 树形视图 -->
      <template v-else>
        <el-table
          v-loading="loading"
          :data="treeList"
          style="margin-top: 16px; width: 100%"
          row-key="id"
          border
          default-expand-all
          :tree-props="{ children: 'children' }"
        >
          <el-table-column prop="name" label="部门名称" min-width="200" />
          <el-table-column prop="code" label="编码" width="140" />
          <el-table-column label="负责人" width="130">
            <template #default="{ row }">
              {{ row.leader?.nickname || row.leader?.username || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openCreateDialog(row.id)">
                加子部门
              </el-button>
              <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-popconfirm title="确定删除该部门吗?" confirm-button-type="danger" @confirm="handleDelete(row)">
                <template #reference><el-button link type="danger" size="small">删除</el-button></template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增部门' : '编辑部门'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="deptTreeSelectOptions"
            check-strictly
            :props="{ label: 'name', children: 'children', value: 'id' }"
            placeholder="不选则为顶级部门"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="form.code" maxlength="50" show-word-limit placeholder="英文或数字编码" />
        </el-form-item>
        <el-form-item label="负责人" prop="leaderId">
          <el-input-number v-model="form.leaderId" :min="1" controls-position="right" placeholder="输入用户ID (后续做人员选择器)" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getDepartmentList, getDepartmentTree, createDepartment, updateDepartment, deleteDepartment,
} from '@/api/department'
import type { Department } from '@/api/types'

const loading = ref(false)
const viewMode = ref<'flat' | 'tree'>('flat')

// 扁平
const flatList = ref<Department[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 树
const treeList = ref<Department[]>([])

const filters = reactive<{ keyword?: string; status?: number }>({ keyword: '', status: undefined })

// 上级部门树选项 (始终完整, 供 tree-select)
const deptTreeSelectOptions = ref<Department[]>([])

async function loadFlatList() {
  loading.value = true
  try {
    const res = await getDepartmentList({
      page: page.value, pageSize: pageSize.value, keyword: filters.keyword || undefined, status: filters.status,
    })
    flatList.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

async function loadTreeList() {
  loading.value = true
  try {
    const res = await getDepartmentTree()
    treeList.value = res.data || []
  } finally { loading.value = false }
}

async function loadDeptTreeForSelect() {
  try {
    const res = await getDepartmentTree()
    deptTreeSelectOptions.value = res.data || []
  } catch { /* noop */ }
}

function handleSearch() {
  page.value = 1
  if (viewMode.value === 'flat') loadFlatList()
  else loadTreeList()
}
function handleReset() {
  filters.keyword = ''
  filters.status = undefined
  handleSearch()
}

watch(viewMode, (m) => {
  if (m === 'flat') loadFlatList()
  else loadTreeList()
})

// ---------- dialog ----------
const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<Partial<Department> & { name: string; status: number; sort: number }>({
  id: undefined, name: '', code: '', parentId: null, leaderId: null, sort: 0, status: 1,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }, { max: 100, trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function openCreateDialog(parentId?: number) {
  mode.value = 'create'
  Object.assign(form, {
    id: undefined, name: '', code: '', parentId: parentId ?? null,
    leaderId: null, sort: 0, status: 1,
  })
  loadDeptTreeForSelect().finally(() => {
    dialogVisible.value = true
  })
}
function openEditDialog(row: Department) {
  mode.value = 'edit'
  Object.assign(form, {
    id: row.id, name: row.name, code: row.code ?? '',
    parentId: row.parentId ?? null,
    leaderId: row.leaderId ?? null,
    sort: row.sort ?? 0,
    status: row.status,
  })
  loadDeptTreeForSelect().finally(() => {
    dialogVisible.value = true
  })
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (mode.value === 'create') {
      await createDepartment({
        name: form.name,
        code: form.code || undefined,
        parentId: form.parentId ?? undefined,
        leaderId: form.leaderId ?? undefined,
        sort: form.sort,
        status: form.status,
      })
      ElMessage.success('创建部门成功')
    } else if (form.id) {
      await updateDepartment(form.id, {
        name: form.name,
        code: form.code || undefined,
        parentId: form.parentId === 0 ? undefined : (form.parentId ?? undefined),
        leaderId: form.leaderId ?? undefined,
        sort: form.sort,
        status: form.status,
      })
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    viewMode.value === 'flat' ? loadFlatList() : loadTreeList()
    loadDeptTreeForSelect()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: Department) {
  try {
    await deleteDepartment(row.id)
    ElMessage.success('删除成功')
    if (viewMode.value === 'flat') {
      if (flatList.value.length === 1 && page.value > 1) page.value -= 1
      loadFlatList()
    } else {
      loadTreeList()
    }
    loadDeptTreeForSelect()
  } catch { /* noop */ }
}

onMounted(async () => {
  await Promise.all([loadFlatList(), loadDeptTreeForSelect()])
})
</script>

<style scoped lang="less">
.dept-manage-page { width: 100%; }
.page-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.filter-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  .spacer { flex: 1; min-width: 4px; }
}
.pagination-bar { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>

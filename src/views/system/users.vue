<template>
  <div class="user-manage-page">
    <el-card class="page-card" shadow="never">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索用户名/昵称/邮箱"
          clearable
          style="width: 260px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.roleId"
          placeholder="按角色筛选"
          clearable
          style="width: 180px"
          @change="handleSearch"
        >
          <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
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
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;新增用户
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="list"
        style="width: 100%; margin-top: 16px"
        stripe
        border
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="110" />
        <el-table-column label="角色" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" v-if="row.role" :type="roleTagType(row.role.code)">
              {{ row.role.name }}
            </el-tag>
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="openRoleDialog(row)">
              改角色
            </el-button>
            <el-popconfirm
              title="确定删除该用户吗?"
              confirm-button-text="删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑 对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formMode === 'create' ? '新增用户' : '编辑用户'"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="86px"
        label-position="right"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="formMode === 'edit'" maxlength="50" show-word-limit placeholder="登录用,创建后不可改" />
        </el-form-item>
        <el-form-item v-if="formMode === 'create'" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password maxlength="50" placeholder="6-50位" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" maxlength="50" show-word-limit placeholder="显示名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="example@mail.com" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="20" placeholder="11位手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
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
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ formMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 改角色 对话框 -->
    <el-dialog v-model="roleDialogVisible" title="修改用户角色" width="360px" destroy-on-close>
      <el-form label-width="70px">
        <el-form-item label="用户">
          <span>{{ roleTarget?.username }} ({{ roleTarget?.nickname || '无昵称' }})</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="selectedRoleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRoleChange">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getUserList, createUser, updateUser, deleteUser, changeUserRole,
  getRoles, type CreateUserPayload,
} from '@/api/user.service'
import type { User, Role } from '@/api/types'

// ---------- 查询 ----------
const loading = ref(false)
const list = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive<{ keyword?: string; roleId?: number; status?: number }>({
  keyword: '',
  roleId: undefined,
  status: undefined,
})

async function loadList() {
  loading.value = true
  try {
    const res = await getUserList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
      roleId: filters.roleId,
      status: filters.status,
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
  filters.roleId = undefined
  filters.status = undefined
  handleSearch()
}

// ---------- 角色选项 ----------
const roleOptions = ref<Role[]>([])
async function loadRoles() {
  try {
    const res = await getRoles()
    roleOptions.value = res.data || []
  } catch { /* noop */ }
}
function roleTagType(code?: string) {
  if (!code) return 'info' as const
  if (code.toUpperCase().includes('ADMIN')) return 'danger'
  if (code.toUpperCase().includes('VIEWER')) return 'info'
  return 'success'
}

// ---------- 新增/编辑表单 ----------
type FormMode = 'create' | 'edit'
const formMode = ref<FormMode>('create')
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<CreateUserPayload & { id?: number }>({
  id: undefined,
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  roleId: 2,
  status: 1,
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 2, max: 50, message: '长度 2-50', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, max: 50, message: '长度 6-50', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function openCreateDialog() {
  formMode.value = 'create'
  Object.assign(form, {
    id: undefined, username: '', password: '', nickname: '',
    email: '', phone: '', roleId: 2, status: 1,
  })
  dialogVisible.value = true
}
function openEditDialog(row: User) {
  formMode.value = 'edit'
  Object.assign(form, {
    id: row.id, username: row.username, password: '',
    nickname: row.nickname ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    roleId: row.roleId ?? 2,
    status: row.status,
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return

  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await createUser({
        username: form.username,
        password: form.password,
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        roleId: form.roleId,
        status: form.status,
      })
      ElMessage.success('创建用户成功')
    } else if (form.id) {
      await updateUser(form.id, {
        nickname: form.nickname || null,
        email: form.email || null,
        phone: form.phone || null,
        roleId: form.roleId,
        status: form.status,
      })
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

// ---------- 删除 ----------
async function handleDelete(row: User) {
  try {
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    if (list.value.length === 1 && page.value > 1) page.value -= 1
    loadList()
  } catch { /* noop */ }
}

// ---------- 改角色 ----------
const roleDialogVisible = ref(false)
const roleTarget = ref<User | null>(null)
const selectedRoleId = ref<number | undefined>()
function openRoleDialog(row: User) {
  roleTarget.value = row
  selectedRoleId.value = row.roleId
  roleDialogVisible.value = true
}
async function submitRoleChange() {
  if (!roleTarget.value || selectedRoleId.value === undefined) {
    ElMessage.warning('请选择角色')
    return
  }
  submitting.value = true
  try {
    await changeUserRole(roleTarget.value.id, selectedRoleId.value)
    ElMessage.success('角色已更新')
    roleDialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRoles()
  loadList()
})
</script>

<style scoped lang="less">
.user-manage-page {
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
</style>

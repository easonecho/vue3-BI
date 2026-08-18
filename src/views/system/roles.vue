<template>
  <div class="role-manage-page">
    <el-card class="page-card" shadow="never">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索角色名/编码/描述" clearable style="width: 260px" :prefix-icon="Search" @keyup.enter="handleSearch" @clear="handleSearch" />
        <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>&nbsp;查询</el-button>
        <el-button @click="handleReset"><el-icon><Refresh /></el-icon>&nbsp;重置</el-button>
        <div class="spacer" />
        <el-button type="success" @click="openCreateDialog"><el-icon><Plus /></el-icon>&nbsp;新增角色</el-button>
      </div>
      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="角色名" min-width="120" />
        <el-table-column prop="code" label="编码" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="codeTagType(row.code)" effect="light">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据范围" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="dsTypeMap[row.dsType || 'all']?.type">{{ dsTypeMap[row.dsType || 'all']?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联用户" width="100" align="center">
          <template #default="{ row }">{{ row._count?.users ?? row._count?.userRoles ?? 0 }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :disabled="isBuiltin(row.id)" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'system:role:menu'" link type="warning" size="small" @click="openMenuDialog(row)">分配菜单</el-button>
            <el-popconfirm v-if="!isBuiltin(row.id)" title="确定删除该角色吗?" confirm-button-type="danger" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
            <el-tooltip v-else content="内置角色不可删除" placement="top">
              <el-button link type="info" size="small" disabled>删除</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-bar">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" background @size-change="loadList" @current-change="loadList" />
      </div>
    </el-card>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增角色' : '编辑角色'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit placeholder="中文显示名" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" :disabled="mode === 'edit'" maxlength="50" show-word-limit placeholder="英文大写, 如 EDITOR" />
        </el-form-item>
        <el-form-item label="数据范围" prop="dsType">
          <el-select v-model="form.dsType" style="width: 100%">
            <el-option v-for="(v, k) in dsTypeMap" :key="k" :label="`${v.label} - ${v.desc}`" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="权限点">
          <el-input v-model="permissionsText" type="textarea" :rows="3" placeholder="每行一个, 如 dashboard:view&#10;chart:edit" />
          <div style="color: #9ca3af; font-size: 12px; margin-top: 4px">内置权限格式: module:action</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单弹窗 -->
    <el-dialog v-model="menuDialogVisible" title="分配菜单权限" width="480px" destroy-on-close>
      <div v-loading="menuLoading">
        <p style="color: #6b7280; margin-bottom: 12px; font-size: 13px">
          当前角色: <strong>{{ menuRole?.name }}</strong>
        </p>
        <el-tree
          ref="menuTreeRef" :data="menuTreeData" show-checkbox node-key="id"
          :props="{ label: 'name', children: 'children' }" default-expand-all
          check-strictly
        />
      </div>
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="menuSubmitting" @click="submitMenuAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/role'
import { getMenuTreeSelect, getRoleMenuIds, assignRoleMenus, type MenuTreeNode } from '@/api/menu'
import type { Role } from '@/api/types'

const BUILTIN = new Set([1, 2, 3])
const isBuiltin = (id: number) => BUILTIN.has(id)

const dsTypeMap: Record<string, { label: string; type: 'success' | 'info' | 'warning' | 'primary'; desc: string }> = {
  all:         { label: '全部',       type: 'success', desc: '查看所有数据' },
  oneself:     { label: '仅本人',     type: 'info',    desc: '仅看自己创建' },
  subordinate: { label: '本部门及下级', type: 'primary', desc: '按部门层级查看' },
  custom:      { label: '自定义',     type: 'warning', desc: '按自定义规则' },
}

const loading = ref(false)
const list = ref<Role[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filters = reactive<{ keyword?: string }>({ keyword: '' })

async function loadList() {
  loading.value = true
  try {
    const res = await getRoleList({ page: page.value, pageSize: pageSize.value, keyword: filters.keyword || undefined })
    list.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}
function handleSearch() { page.value = 1; loadList() }
function handleReset() { filters.keyword = ''; handleSearch() }

function codeTagType(code?: string) {
  if (!code) return 'info' as const
  const c = code.toUpperCase()
  if (c.includes('ADMIN')) return 'danger'
  if (c.includes('VIEWER')) return 'info'
  if (c.includes('EDITOR')) return 'success'
  return 'primary'
}

// ----------- 新增/编辑弹窗 -----------
const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<Partial<Role> & { name: string; code: string; dsType: Role['dsType'] }>({
  id: undefined, name: '', code: '', description: '', dsType: 'all', permissions: [],
})
const permissionsText = ref('')
const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  dsType: [{ required: true, message: '请选择数据范围', trigger: 'change' }],
}

function openCreateDialog() {
  mode.value = 'create'
  Object.assign(form, { id: undefined, name: '', code: '', description: '', dsType: 'all', permissions: [] })
  permissionsText.value = ''
  dialogVisible.value = true
}
function openEditDialog(row: Role) {
  mode.value = 'edit'
  Object.assign(form, { id: row.id, name: row.name, code: row.code, description: row.description ?? '', dsType: row.dsType ?? 'all', permissions: Array.isArray(row.permissions) ? row.permissions : [] })
  permissionsText.value = Array.isArray(row.permissions) ? row.permissions.join('\n') : ''
  dialogVisible.value = true
}
function parsePerms(): string[] {
  return (permissionsText.value || '').split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean)
}
async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    const permissions = parsePerms()
    if (mode.value === 'create') {
      await createRole({ name: form.name, code: form.code, description: form.description, dsType: form.dsType, permissions })
      ElMessage.success('创建角色成功')
    } else if (form.id) {
      await updateRole(form.id, { name: form.name, description: form.description, dsType: form.dsType, permissions })
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadList()
  } finally { submitting.value = false }
}
async function handleDelete(row: Role) {
  try {
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    if (list.value.length === 1 && page.value > 1) page.value -= 1
    loadList()
  } catch { /* noop */ }
}

// ----------- 分配菜单弹窗 -----------
const menuDialogVisible = ref(false)
const menuLoading = ref(false)
const menuSubmitting = ref(false)
const menuRole = ref<Role | null>(null)
const menuTreeRef = ref()
const menuTreeData = ref<MenuTreeNode[]>([])

async function openMenuDialog(row: Role) {
  menuRole.value = row
  menuDialogVisible.value = true
  menuLoading.value = true
  try {
    const [treeRes, idsRes] = await Promise.all([
      getMenuTreeSelect(),
      getRoleMenuIds(row.id),
    ])
    menuTreeData.value = treeRes.data || []
    const ids: number[] = idsRes.data || []
    // 等待 tree 渲染
    await nextTick()
    menuTreeRef.value?.setCheckedKeys(ids, false)
  } catch { /* noop */ } finally { menuLoading.value = false }
}

async function submitMenuAssign() {
  if (!menuRole.value) return
  menuSubmitting.value = true
  try {
    const checked = menuTreeRef.value?.getCheckedKeys() || []
    const halfChecked = menuTreeRef.value?.getHalfCheckedKeys() || []
    const allIds = [...checked, ...halfChecked]
    await assignRoleMenus(menuRole.value.id, allIds)
    ElMessage.success('分配菜单成功')
    menuDialogVisible.value = false
  } catch { /* noop */ } finally { menuSubmitting.value = false }
}

import { nextTick } from 'vue'
onMounted(loadList)
</script>

<style scoped lang="less">
.role-manage-page { width: 100%; }
.page-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; .spacer { flex: 1; min-width: 4px; } }
.pagination-bar { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>

<template>
  <div class="tenant-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索租户编码/名称"
          clearable
          style="width: 240px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 130px">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadList">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <div class="spacer" />
        <el-button v-permission="'system:tenant:add'" type="success" @click="openCreate">
          <el-icon><Plus /></el-icon>&nbsp;新增租户
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="code" label="租户编码" min-width="120">
          <template #default="{ row }"><el-tag size="small">{{ row.code }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="name" label="租户名称" min-width="150" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="120" show-overflow-tooltip />
        <el-table-column label="用户上限" width="100" align="center">
          <template #default="{ row }">{{ row.maxUsers ?? '不限' }}</template>
        </el-table-column>
        <el-table-column label="到期时间" width="170">
          <template #default="{ row }">{{ formatTime(row.expiredAt) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'system:tenant:edit'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.id !== PLATFORM_TENANT_ID"
              v-permission="'system:tenant:edit'"
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @size-change="loadList"
        @current-change="loadList"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'create' ? '新增租户' : '编辑租户'"
      width="580px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="租户编码" prop="code">
          <el-input
            v-model="form.code"
            :disabled="mode === 'edit'"
            maxlength="50"
            placeholder="登录时使用，如 acme"
          />
        </el-form-item>
        <el-form-item label="租户名称" prop="name">
          <el-input v-model="form.name" maxlength="100" placeholder="如 Acme 公司" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact" maxlength="100" />
        </el-form-item>
        <el-form-item label="用户上限">
          <el-input-number v-model="form.maxUsers" :min="1" :max="100000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="form.expiredAt"
            type="datetime"
            placeholder="留空表示永久有效"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="mode === 'edit'" label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  getTenantList,
  createTenant,
  updateTenant,
  type Tenant,
  type TenantQuery,
} from '@/api/tenant'

const PLATFORM_TENANT_ID = 1

const loading = ref(false)
const list = ref<Tenant[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filters = reactive<{ keyword: string; status?: number }>({ keyword: '' })

async function loadList() {
  loading.value = true
  try {
    const res = await getTenantList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
      status: filters.status,
    } as TenantQuery)
    list.value = res.data.list
    total.value = res.data.total
  } catch {
    /* 错误已由请求层提示 */
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  id: 0,
  code: '',
  name: '',
  contact: '',
  maxUsers: undefined as number | undefined,
  expiredAt: null as Date | null,
  status: 1,
  remark: '',
})
const rules: FormRules = {
  code: [
    { required: true, message: '请输入租户编码', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]{2,50}$/,
      message: '仅支持字母、数字、下划线、中划线，长度 2-50',
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
}

function openCreate() {
  mode.value = 'create'
  Object.assign(form, {
    id: 0,
    code: '',
    name: '',
    contact: '',
    maxUsers: undefined,
    expiredAt: null,
    status: 1,
    remark: '',
  })
  dialogVisible.value = true
}

function openEdit(row: Tenant) {
  mode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    code: row.code,
    name: row.name,
    contact: row.contact || '',
    maxUsers: row.maxUsers ?? undefined,
    expiredAt: row.expiredAt ? new Date(row.expiredAt) : null,
    status: row.status,
    remark: row.remark || '',
  })
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  const payload = {
    name: form.name,
    contact: form.contact || undefined,
    maxUsers: form.maxUsers ?? null,
    expiredAt: form.expiredAt ? form.expiredAt.toISOString() : null,
    remark: form.remark || undefined,
  }
  try {
    if (mode.value === 'create') {
      await createTenant({ ...payload, code: form.code })
      ElMessage.success('创建成功')
    } else {
      await updateTenant(form.id, { ...payload, status: form.status })
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    await loadList()
  } catch {
    /* 错误已由请求层提示 */
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row: Tenant) {
  const next = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(
      `确定${next === 1 ? '启用' : '停用'}租户「${row.name}」吗？停用后该租户用户将无法访问。`,
      '提示',
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await updateTenant(row.id, { status: next })
    ElMessage.success(next === 1 ? '已启用' : '已停用')
    await loadList()
  } catch {
    /* 错误已由请求层提示 */
  }
}

function formatTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

onMounted(loadList)
</script>

<style scoped>
.tenant-page {
  padding: 16px;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.spacer {
  flex: 1;
}
</style>

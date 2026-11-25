<template>
  <div class="tenant-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          :placeholder="t('tenantPage.searchPlaceholder')"
          clearable
          style="width: 240px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-select
          v-model="filters.status"
          :placeholder="t('tenantPage.allStatus')"
          clearable
          style="width: 130px"
        >
          <el-option :label="t('tenantPage.enabled')" :value="1" />
          <el-option :label="t('tenantPage.disabled')" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadList">
          <el-icon><Search /></el-icon>&nbsp;{{ t('tenantPage.query') }}
        </el-button>
        <div class="spacer" />
        <el-button v-permission="'system:tenant:add'" type="success" @click="openCreate">
          <el-icon><Plus /></el-icon>&nbsp;{{ t('tenantPage.create') }}
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="code" :label="t('tenantPage.code')" min-width="120">
          <template #default="{ row }"
            ><el-tag size="small">{{ row.code }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="name" :label="t('tenantPage.name')" min-width="150" />
        <el-table-column :label="t('tenantPage.status')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? t('tenantPage.enabled') : t('tenantPage.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="contact"
          :label="t('tenantPage.contact')"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column :label="t('tenantPage.maxUsers')" width="100" align="center">
          <template #default="{ row }">{{ row.maxUsers ?? t('tenantPage.unlimited') }}</template>
        </el-table-column>
        <el-table-column :label="t('tenantPage.expiredAt')" width="170">
          <template #default="{ row }">{{ formatTime(row.expiredAt) }}</template>
        </el-table-column>
        <el-table-column
          prop="remark"
          :label="t('tenantPage.remark')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column :label="t('tenantPage.createdAt')" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'system:tenant:edit'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              v-if="row.id !== PLATFORM_TENANT_ID"
              v-permission="'system:tenant:edit'"
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? t('tenantPage.disabled') : t('tenantPage.enabled') }}
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
      :title="mode === 'create' ? t('tenantPage.create') : t('tenantPage.editTitle')"
      width="580px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="t('tenantPage.code')" prop="code">
          <el-input
            v-model="form.code"
            :disabled="mode === 'edit'"
            maxlength="50"
            :placeholder="t('tenantPage.codePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('tenantPage.name')" prop="name">
          <el-input
            v-model="form.name"
            maxlength="100"
            :placeholder="t('tenantPage.namePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('tenantPage.contact')">
          <el-input v-model="form.contact" maxlength="100" />
        </el-form-item>
        <el-form-item :label="t('tenantPage.maxUsers')">
          <el-input-number v-model="form.maxUsers" :min="1" :max="100000" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('tenantPage.expiredAt')">
          <el-date-picker
            v-model="form.expiredAt"
            type="datetime"
            :placeholder="t('tenantPage.expirePlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="mode === 'edit'" :label="t('tenantPage.status')">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="t('tenantPage.remark')">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{
          t('tenantPage.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  getTenantList,
  createTenant,
  updateTenant,
  type Tenant,
  type TenantQuery,
} from '@/api/tenant'
import { formatDateTime } from '@/utils/locale-format'

const { t } = useI18n()

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
const rules = computed<FormRules>(() => ({
  code: [
    { required: true, message: t('tenantPage.codeRequired'), trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]{2,50}$/,
      message: t('tenantPage.codePattern'),
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: t('tenantPage.nameRequired'), trigger: 'blur' }],
}))

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
      ElMessage.success(t('tenantPage.createSuccess'))
    } else {
      await updateTenant(form.id, { ...payload, status: form.status })
      ElMessage.success(t('tenantPage.saveSuccess'))
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
      t(next === 1 ? 'tenantPage.toggleConfirmEnable' : 'tenantPage.toggleConfirmDisable', {
        name: row.name,
      }),
      t('tenantPage.tip'),
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await updateTenant(row.id, { status: next })
    ElMessage.success(t(next === 1 ? 'tenantPage.enabledDone' : 'tenantPage.disabledDone'))
    await loadList()
  } catch {
    /* 错误已由请求层提示 */
  }
}

function formatTime(value: string | null) {
  if (!value) return '—'
  return formatDateTime(value)
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

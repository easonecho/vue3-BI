<template>
  <el-dialog
    v-model="visible"
    :title="
      dataset
        ? t('datasetPage.columnPermission.titleWithName', { name: dataset.name })
        : t('datasetPage.columnPermission.title')
    "
    width="880px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="rls-toolbar">
      <el-button
        type="primary"
        size="small"
        :disabled="fieldOptions.length === 0"
        @click="openCreate"
      >
        <el-icon><Plus /></el-icon>&nbsp;{{ t('datasetPage.columnPermission.add') }}
      </el-button>
      <span class="rls-hint">
        {{ t('datasetPage.columnPermission.hint') }}
      </span>
    </div>

    <el-alert
      v-if="fieldOptions.length === 0"
      type="warning"
      :closable="false"
      show-icon
      :title="t('datasetPage.columnPermission.noFieldsAlert')"
      style="margin-bottom: 12px"
    />

    <el-table v-loading="loading" :data="rules" size="small" border>
      <el-table-column
        prop="name"
        :label="t('datasetPage.columnPermission.colName')"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column :label="t('datasetPage.columnPermission.colSubject')" width="180">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ subjectLabel(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.columnPermission.colHiddenFields')" min-width="240">
        <template #default="{ row }">
          <el-tag
            v-for="f in row.fields || []"
            :key="f"
            size="small"
            type="warning"
            effect="plain"
            class="field-tag"
          >
            {{ f }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="priority"
        :label="t('datasetPage.columnPermission.colPriority')"
        width="80"
        align="center"
      />
      <el-table-column
        :label="t('datasetPage.columnPermission.colEnabled')"
        width="80"
        align="center"
      >
        <template #default="{ row }">
          <el-switch v-model="row.enabled" size="small" @change="toggleEnabled(row)" />
        </template>
      </el-table-column>
      <el-table-column
        :label="t('datasetPage.columnPermission.colActions')"
        width="120"
        align="center"
      >
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">{{
            t('common.edit')
          }}</el-button>
          <el-popconfirm
            :title="t('datasetPage.columnPermission.deleteConfirm')"
            confirm-button-type="danger"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button link type="danger" size="small">{{ t('common.delete') }}</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && rules.length === 0"
      :description="t('datasetPage.columnPermission.empty')"
      :image-size="60"
    />

    <!-- 新增/编辑规则 -->
    <el-dialog
      v-model="formVisible"
      :title="
        editingId
          ? t('datasetPage.columnPermission.editTitle')
          : t('datasetPage.columnPermission.createTitle')
      "
      width="660px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
        <el-form-item :label="t('datasetPage.rowPermissionForm.nameLabel')" prop="name">
          <el-input
            v-model="form.name"
            maxlength="100"
            :placeholder="t('datasetPage.columnPermission.namePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('datasetPage.rowPermissionForm.subjectLabel')" prop="subjectType">
          <el-radio-group v-model="form.subjectType" @change="form.subjectId = undefined">
            <el-radio-button value="all">{{
              t('datasetPage.rowPermissionForm.subjectAll')
            }}</el-radio-button>
            <el-radio-button value="role">{{
              t('datasetPage.rowPermissionForm.subjectRole')
            }}</el-radio-button>
            <el-radio-button value="user">{{
              t('datasetPage.rowPermissionForm.subjectUser')
            }}</el-radio-button>
            <el-radio-button value="dept">{{
              t('datasetPage.rowPermissionForm.subjectDept')
            }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="form.subjectType !== 'all'"
          :label="t('datasetPage.rowPermissionForm.subjectIdLabel')"
          prop="subjectId"
        >
          <el-select
            v-model="form.subjectId"
            filterable
            :placeholder="t('datasetPage.rowPermissionForm.subjectIdPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="opt in subjectOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('datasetPage.columnPermission.colHiddenFields')" prop="fields">
          <el-select
            v-model="form.fields"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('datasetPage.columnPermission.hiddenPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="opt in fieldOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('datasetPage.rowPermissionForm.priorityLabel')">
          <el-input-number v-model="form.priority" :min="0" :max="9999" controls-position="right" />
          <span class="rls-hint" style="margin-left: 10px">{{
            t('datasetPage.columnPermission.priorityHint')
          }}</span>
        </el-form-item>
        <el-form-item :label="t('datasetPage.rowPermissionForm.enabledLabel')">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">{{
          t('datasetPage.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  type ColumnPermission,
  type ColumnPermissionInput,
  type RowPermissionOptions,
  type RowSubjectType,
  createColumnPermission,
  deleteColumnPermission,
  getColumnPermissions,
  getRowPermissionOptions,
  updateColumnPermission,
} from '@/api/dataset'

const props = defineProps<{
  modelValue: boolean
  dataset: { id: number; name: string; fields?: unknown } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  saved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const rules = ref<ColumnPermission[]>([])
const loading = ref(false)
const options = ref<RowPermissionOptions>({ roles: [], users: [], departments: [] })

const { t } = useI18n()

/** 数据集字段展示名 (alias 优先), 作为隐藏字段的配置值 */
const fieldOptions = computed<{ label: string; value: string }[]>(() => {
  const raw = props.dataset?.fields
  let list: any[] = []
  if (Array.isArray(raw)) list = raw
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) list = parsed
    } catch {
      list = []
    }
  }
  return list
    .filter((f) => f && typeof f.name === 'string' && f.name)
    .map((f) => {
      const display = f.alias || f.name
      const suffix = f.alias ? ` (${f.name})` : ''
      const role =
        f.role === 'measure'
          ? t('datasetPage.columnPermission.roleMeasure')
          : f.role === 'dimension'
            ? t('datasetPage.columnPermission.roleDimension')
            : ''
      return { label: `${display}${suffix}${role}`, value: display }
    })
})

// ---------- 列表 ----------
async function loadRules() {
  if (!props.dataset) return
  loading.value = true
  try {
    const res = await getColumnPermissions(props.dataset.id)
    rules.value = (res.data || []).map((r) => ({
      ...r,
      fields: Array.isArray(r.fields) ? r.fields : [],
    }))
  } catch (e: any) {
    ElMessage.error(e?.message || t('datasetPage.columnPermission.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    const res = await getRowPermissionOptions()
    options.value = res.data || { roles: [], users: [], departments: [] }
  } catch {
    options.value = { roles: [], users: [], departments: [] }
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      loadRules()
      loadOptions()
    }
  },
  { immediate: true },
)

function handleClosed() {
  rules.value = []
}

// ---------- 展示 ----------
const subjectLabel = (rule: ColumnPermission): string => {
  if (rule.subjectType === 'all') return t('datasetPage.subject.all')
  if (rule.subjectType === 'role') {
    const item = options.value.roles.find((r) => r.id === rule.subjectId)
    return t('datasetPage.subject.role', { name: item?.name ?? `#${rule.subjectId}` })
  }
  if (rule.subjectType === 'user') {
    const item = options.value.users.find((u) => u.id === rule.subjectId)
    const name = item ? item.nickname || item.username : `#${rule.subjectId}`
    return t('datasetPage.subject.user', { name })
  }
  const item = options.value.departments.find((d) => d.id === rule.subjectId)
  return t('datasetPage.subject.dept', { name: item?.name ?? `#${rule.subjectId}` })
}

// ---------- 表单 ----------
const formVisible = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<{
  name: string
  subjectType: RowSubjectType
  subjectId?: number
  fields: string[]
  priority: number
  enabled: boolean
}>({
  name: '',
  subjectType: 'all',
  subjectId: undefined,
  fields: [],
  priority: 0,
  enabled: true,
})

const subjectOptions = computed(() => {
  if (form.subjectType === 'role') {
    return options.value.roles.map((r) => ({ label: `${r.name} (${r.code})`, value: r.id }))
  }
  if (form.subjectType === 'user') {
    return options.value.users.map((u) => ({
      label: u.nickname ? `${u.nickname} (${u.username})` : u.username,
      value: u.id,
    }))
  }
  if (form.subjectType === 'dept') {
    return options.value.departments.map((d) => ({ label: d.name, value: d.id }))
  }
  return []
})

const formRules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('datasetPage.rowPermissionForm.nameRequired'), trigger: 'blur' },
  ],
  subjectId: [
    {
      validator: (_rule, value, callback) => {
        if (form.subjectType !== 'all' && (value === undefined || value === null)) {
          callback(new Error(t('datasetPage.rowPermissionForm.subjectRequired')))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
  fields: [
    {
      required: true,
      message: t('datasetPage.columnPermission.hiddenFieldsRequired'),
      trigger: 'change',
    },
  ],
}))

function resetForm() {
  form.name = ''
  form.subjectType = 'all'
  form.subjectId = undefined
  form.fields = []
  form.priority = 0
  form.enabled = true
  formRef.value?.clearValidate()
}

function openCreate() {
  editingId.value = null
  resetForm()
  formVisible.value = true
}

function openEdit(rule: ColumnPermission) {
  editingId.value = rule.id
  form.name = rule.name
  form.subjectType = rule.subjectType
  form.subjectId = rule.subjectId ?? undefined
  form.fields = [...(rule.fields || [])]
  form.priority = rule.priority ?? 0
  form.enabled = rule.enabled
  formVisible.value = true
}

async function submitForm() {
  if (!props.dataset || !formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (form.fields.length === 0) {
    ElMessage.warning(t('datasetPage.columnPermission.hiddenFieldsRequired'))
    return
  }

  const payload: ColumnPermissionInput = {
    name: form.name.trim(),
    subjectType: form.subjectType,
    subjectId: form.subjectType === 'all' ? null : form.subjectId,
    fields: form.fields,
    priority: form.priority,
    enabled: form.enabled,
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await updateColumnPermission(props.dataset.id, editingId.value, payload)
      ElMessage.success(t('datasetPage.columnPermission.updated'))
    } else {
      await createColumnPermission(props.dataset.id, payload)
      ElMessage.success(t('datasetPage.columnPermission.created'))
    }
    formVisible.value = false
    await loadRules()
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || t('datasetPage.columnPermission.saveFailed'))
  } finally {
    submitting.value = false
  }
}

async function toggleEnabled(rule: ColumnPermission) {
  if (!props.dataset) return
  try {
    await updateColumnPermission(props.dataset.id, rule.id, {
      name: rule.name,
      subjectType: rule.subjectType,
      subjectId: rule.subjectId ?? null,
      fields: rule.fields,
      priority: rule.priority,
      enabled: rule.enabled,
    })
    ElMessage.success(
      rule.enabled
        ? t('datasetPage.columnPermission.enabled')
        : t('datasetPage.columnPermission.disabled'),
    )
  } catch (e: any) {
    rule.enabled = !rule.enabled
    ElMessage.error(e?.message || t('datasetPage.columnPermission.operationFailed'))
  }
}

async function handleDelete(rule: ColumnPermission) {
  if (!props.dataset) return
  try {
    await deleteColumnPermission(props.dataset.id, rule.id)
    ElMessage.success(t('datasetPage.columnPermission.deleted'))
    await loadRules()
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || t('datasetPage.columnPermission.deleteFailed'))
  }
}
</script>

<style scoped>
.rls-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.rls-hint {
  font-size: 12px;
  color: #9ca3af;
}
.field-tag {
  margin: 2px 4px 2px 0;
}
</style>

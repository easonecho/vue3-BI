<template>
  <el-dialog
    v-model="visible"
    :title="dataset ? `行级权限 - ${dataset.name}` : '行级权限'"
    width="880px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="rls-toolbar">
      <el-button type="primary" size="small" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;新增规则
      </el-button>
      <span class="rls-hint">
        单条规则内多条件为 AND，多条规则为 OR；未命中规则时不做过滤
      </span>
    </div>

    <el-table v-loading="loading" :data="rules" size="small" border>
      <el-table-column prop="name" label="规则名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="适用对象" width="190">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ subjectLabel(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="过滤条件" min-width="260">
        <template #default="{ row }">
          <span class="cond-text">{{ conditionsLabel(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80" align="center" />
      <el-table-column label="启用" width="80" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" size="small" @change="toggleEnabled(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除该规则吗?" confirm-button-type="danger" @confirm="handleDelete(row)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && rules.length === 0"
      description="暂无行级权限规则"
      :image-size="60"
    />

    <!-- 新增/编辑规则 -->
    <el-dialog
      v-model="formVisible"
      :title="editingId ? '编辑规则' : '新增规则'"
      width="660px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" maxlength="100" placeholder="如: 华东区销售仅看本区数据" />
        </el-form-item>
        <el-form-item label="适用对象" prop="subjectType">
          <el-radio-group v-model="form.subjectType" @change="form.subjectId = undefined">
            <el-radio-button value="all">全员</el-radio-button>
            <el-radio-button value="role">角色</el-radio-button>
            <el-radio-button value="user">用户</el-radio-button>
            <el-radio-button value="dept">部门</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.subjectType !== 'all'" label="选择对象" prop="subjectId">
          <el-select v-model="form.subjectId" filterable placeholder="请选择" style="width: 100%">
            <el-option
              v-for="opt in subjectOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="过滤条件" required>
          <div class="cond-list">
            <div v-for="(cond, idx) in form.conditions" :key="idx" class="cond-row">
              <el-input v-model="cond.field" size="small" placeholder="字段名" style="width: 150px" />
              <el-select v-model="cond.operator" size="small" style="width: 140px">
                <el-option
                  v-for="op in operatorOptions"
                  :key="op.value"
                  :label="op.label"
                  :value="op.value"
                />
              </el-select>
              <el-input
                v-if="needsValue(cond.operator)"
                v-model="cond.valueText"
                size="small"
                style="flex: 1; min-width: 180px"
                placeholder="值; in/between 用逗号分隔, 支持 {userId}/{username}/{deptId}"
              />
              <el-button
                link
                type="danger"
                size="small"
                :disabled="form.conditions.length <= 1"
                @click="removeCondition(idx)"
              >
                删除
              </el-button>
            </div>
            <el-button size="small" @click="addCondition">+ 添加条件</el-button>
          </div>
        </el-form-item>

        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" :max="9999" controls-position="right" />
          <span class="rls-hint" style="margin-left: 10px">数值越大越先参与组合</span>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  type RowCondition,
  type RowPermission,
  type RowPermissionInput,
  type RowPermissionOperator,
  type RowPermissionOptions,
  type RowSubjectType,
  getRowPermissions,
  getRowPermissionOptions,
  createRowPermission,
  updateRowPermission,
  deleteRowPermission,
} from '@/api/dataset'

const props = defineProps<{
  modelValue: boolean
  dataset: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  saved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const rules = ref<RowPermission[]>([])
const loading = ref(false)
const options = ref<RowPermissionOptions>({ roles: [], users: [], departments: [] })

const operatorOptions: { label: string; value: RowPermissionOperator }[] = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '包含于 (in)', value: 'in' },
  { label: '不包含于 (notIn)', value: 'notIn' },
  { label: '模糊匹配', value: 'like' },
  { label: '为空', value: 'isNull' },
  { label: '不为空', value: 'notNull' },
  { label: '区间 (between)', value: 'between' },
]

const operatorLabels: Record<RowPermissionOperator, string> = {
  eq: '=',
  ne: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  in: 'IN',
  notIn: 'NOT IN',
  like: 'LIKE',
  isNull: '为空',
  notNull: '不为空',
  between: 'BETWEEN',
}

function needsValue(op: RowPermissionOperator) {
  return op !== 'isNull' && op !== 'notNull'
}

// ---------- 列表 ----------
async function loadRules() {
  if (!props.dataset) return
  loading.value = true
  try {
    const res = await getRowPermissions(props.dataset.id)
    rules.value = (res.data || []).map((r) => ({
      ...r,
      conditions: Array.isArray(r.conditions) ? r.conditions : [],
    }))
  } catch (e: any) {
    ElMessage.error(e?.message || '加载行级权限失败')
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
const subjectLabel = (rule: RowPermission): string => {
  if (rule.subjectType === 'all') return '全员'
  if (rule.subjectType === 'role') {
    const item = options.value.roles.find((r) => r.id === rule.subjectId)
    return `角色: ${item?.name ?? `#${rule.subjectId}`}`
  }
  if (rule.subjectType === 'user') {
    const item = options.value.users.find((u) => u.id === rule.subjectId)
    const name = item ? item.nickname || item.username : `#${rule.subjectId}`
    return `用户: ${name}`
  }
  const item = options.value.departments.find((d) => d.id === rule.subjectId)
  return `部门: ${item?.name ?? `#${rule.subjectId}`}`
}

function conditionsLabel(rule: RowPermission): string {
  return (rule.conditions || [])
    .map((c) => {
      if (c.operator === 'isNull' || c.operator === 'notNull') {
        return `${c.field} ${operatorLabels[c.operator]}`
      }
      const value = Array.isArray(c.value) ? c.value.join(',') : String(c.value ?? '')
      return `${c.field} ${operatorLabels[c.operator] ?? c.operator} ${value}`
    })
    .join(' AND ')
}

// ---------- 表单 ----------
interface EditableCondition {
  field: string
  operator: RowPermissionOperator
  valueText: string
}

const formVisible = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<{
  name: string
  subjectType: RowSubjectType
  subjectId?: number
  conditions: EditableCondition[]
  priority: number
  enabled: boolean
}>({
  name: '',
  subjectType: 'all',
  subjectId: undefined,
  conditions: [{ field: '', operator: 'eq', valueText: '' }],
  priority: 0,
  enabled: true,
})

const subjectOptions = computed(() => {
  if (form.subjectType === 'role') {
    return options.value.roles.map((r) => ({
      label: `${r.name} (${r.code})`,
      value: r.id,
    }))
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

const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  subjectId: [
    {
      validator: (_rule, value, callback) => {
        if (form.subjectType !== 'all' && (value === undefined || value === null)) {
          callback(new Error('请选择规则适用的对象'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

function resetForm() {
  form.name = ''
  form.subjectType = 'all'
  form.subjectId = undefined
  form.conditions = [{ field: '', operator: 'eq', valueText: '' }]
  form.priority = 0
  form.enabled = true
}

function openCreate() {
  editingId.value = null
  resetForm()
  formVisible.value = true
}

function openEdit(rule: RowPermission) {
  editingId.value = rule.id
  form.name = rule.name
  form.subjectType = rule.subjectType
  form.subjectId = rule.subjectId ?? undefined
  form.conditions = (rule.conditions || []).map((c) => ({
    field: c.field,
    operator: c.operator,
    valueText: Array.isArray(c.value)
      ? c.value.join(',')
      : c.value === null || c.value === undefined
        ? ''
        : String(c.value),
  }))
  if (form.conditions.length === 0) {
    form.conditions = [{ field: '', operator: 'eq', valueText: '' }]
  }
  form.priority = rule.priority ?? 0
  form.enabled = rule.enabled !== false
  formVisible.value = true
}

function addCondition() {
  form.conditions.push({ field: '', operator: 'eq', valueText: '' })
}

function removeCondition(idx: number) {
  if (form.conditions.length <= 1) return
  form.conditions.splice(idx, 1)
}

/** 文本值转接口值: 数字保持数字, in/between 转数组 */
function parseValue(op: RowPermissionOperator, text: string): unknown {
  if (!needsValue(op)) return undefined
  const raw = text.trim()
  if (op === 'in' || op === 'notIn' || op === 'between') {
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '')
      .map((v) => (/^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v))
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}

function buildConditions(): RowCondition[] {
  return form.conditions
    .filter((c) => c.field.trim() !== '')
    .map((c) => ({
      field: c.field.trim(),
      operator: c.operator,
      value: parseValue(c.operator, c.valueText),
    }))
}

async function submitForm() {
  if (!props.dataset || !formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return

  const conditions = buildConditions()
  if (conditions.length === 0) {
    ElMessage.warning('请至少填写一个有效的过滤条件')
    return
  }

  const payload: RowPermissionInput = {
    name: form.name.trim(),
    subjectType: form.subjectType,
    subjectId: form.subjectType === 'all' ? null : form.subjectId,
    conditions,
    priority: form.priority,
    enabled: form.enabled,
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await updateRowPermission(props.dataset.id, editingId.value, payload)
      ElMessage.success('规则已更新')
    } else {
      await createRowPermission(props.dataset.id, payload)
      ElMessage.success('规则已创建')
    }
    formVisible.value = false
    await loadRules()
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function toggleEnabled(rule: RowPermission) {
  if (!props.dataset) return
  try {
    await updateRowPermission(props.dataset.id, rule.id, {
      name: rule.name,
      subjectType: rule.subjectType,
      subjectId: rule.subjectId,
      conditions: rule.conditions,
      priority: rule.priority,
      enabled: rule.enabled,
    })
    emit('saved')
  } catch (e: any) {
    rule.enabled = !rule.enabled
    ElMessage.error(e?.message || '更新失败')
  }
}

async function handleDelete(rule: RowPermission) {
  if (!props.dataset) return
  try {
    await deleteRowPermission(props.dataset.id, rule.id)
    ElMessage.success('规则已删除')
    await loadRules()
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}
</script>

<style scoped lang="less">
.rls-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.rls-hint {
  color: #9ca3af;
  font-size: 12px;
}
.cond-text {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  color: #374151;
}
.cond-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cond-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

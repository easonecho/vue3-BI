<template>
  <el-dialog v-model="visible" title="看板权限" width="600px" @open="onOpen">
    <el-alert type="info" :closable="false" style="margin-bottom: 12px">
      未添加授权时按租户与数据范围控制；添加后，仅创建者、管理员及下列用户/角色可访问。
    </el-alert>

    <div class="acl-add">
      <el-select v-model="addForm.subjectType" style="width: 96px">
        <el-option label="用户" value="user" />
        <el-option label="角色" value="role" />
      </el-select>
      <el-select v-model="addForm.subjectId" filterable placeholder="选择授权对象" style="flex: 1">
        <el-option
          v-for="opt in subjectOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select v-model="addForm.permission" style="width: 96px">
        <el-option label="可查看" value="view" />
        <el-option label="可编辑" value="edit" />
      </el-select>
      <el-button type="primary" @click="addItem">添加</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="items"
      size="small"
      max-height="320"
      empty-text="暂无授权（同租户内按数据范围访问）"
    >
      <el-table-column label="类型" width="72">
        <template #default="{ row }">{{ row.subjectType === 'user' ? '用户' : '角色' }}</template>
      </el-table-column>
      <el-table-column label="对象">
        <template #default="{ row }">{{ subjectLabel(row.subjectType, row.subjectId) }}</template>
      </el-table-column>
      <el-table-column label="权限" width="110">
        <template #default="{ row }">
          <el-select v-model="row.permission" size="small">
            <el-option label="可查看" value="view" />
            <el-option label="可编辑" value="edit" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column width="72" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" @click="items.splice($index, 1)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 看板级权限 (ACL) 配置
 * 语义: 有授权记录时仅创建者/管理员/命中用户或角色可访问; 无记录时沿用租户+数据范围。
 */
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { Dashboard } from '@/api/types'
import { getDashboardAcl, updateDashboardAcl, type DashboardAclItem } from '@/api/dashboard'
import { getUserList } from '@/api/user'
import { getAllRoles } from '@/api/role'

const props = defineProps<{
  modelValue: boolean
  dashboard: Dashboard | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

interface AclRow extends DashboardAclItem {
  id?: number
}

const items = ref<AclRow[]>([])
const loading = ref(false)
const saving = ref(false)
const users = ref<{ id: number; username: string; nickname?: string }[]>([])
const roles = ref<{ id: number; name: string; code?: string }[]>([])

const addForm = reactive<DashboardAclItem>({
  subjectType: 'user',
  subjectId: 0,
  permission: 'view',
})

const subjectOptions = computed(() =>
  addForm.subjectType === 'user'
    ? users.value.map((u) => ({ value: u.id, label: u.nickname || u.username }))
    : roles.value.map((r) => ({ value: r.id, label: r.name })),
)

/** 把授权对象 ID 还原成可读名称 */
function subjectLabel(type: 'user' | 'role', id: number): string {
  if (type === 'user') {
    const hit = users.value.find((u) => u.id === id)
    return hit ? hit.nickname || hit.username : `用户 #${id}`
  }
  const hit = roles.value.find((r) => r.id === id)
  return hit ? hit.name : `角色 #${id}`
}

async function loadOptions() {
  try {
    const res = await getUserList({ page: 1, pageSize: 100 })
    users.value = (res.data?.list ?? []) as { id: number; username: string; nickname?: string }[]
  } catch {
    users.value = []
  }
  try {
    const res = await getAllRoles()
    roles.value = (res.data ?? []) as { id: number; name: string; code?: string }[]
  } catch {
    roles.value = []
  }
}

async function onOpen() {
  if (!props.dashboard) return
  items.value = []
  await loadOptions()
  loading.value = true
  try {
    const res = await getDashboardAcl(props.dashboard.id)
    items.value = (res.data ?? []).map((row) => ({
      id: row.id,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      permission: row.permission,
    }))
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function addItem() {
  if (!addForm.subjectId) {
    ElMessage.warning('请选择授权对象')
    return
  }
  const exists = items.value.some(
    (row) => row.subjectType === addForm.subjectType && row.subjectId === addForm.subjectId,
  )
  if (exists) {
    ElMessage.warning('该对象已在授权列表中')
    return
  }
  items.value.push({ ...addForm })
  addForm.subjectId = 0
}

async function save() {
  if (!props.dashboard) return
  saving.value = true
  try {
    const payload: DashboardAclItem[] = items.value.map((row) => ({
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      permission: row.permission,
    }))
    await updateDashboardAcl(props.dashboard.id, payload)
    ElMessage.success('授权已更新')
    visible.value = false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.acl-add {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>

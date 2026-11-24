<template>
  <el-dialog v-model="visible" :title="t('dashboard.groupManageTitle')" width="640px">
    <div style="margin-bottom: 12px">
      <el-button type="primary" size="small" @click="openGroupForm()">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('dashboard.addGroup') }}
      </el-button>
    </div>
    <el-table v-loading="loading" :data="groups" size="small" border>
      <el-table-column prop="name" :label="t('dashboard.groupName')" min-width="140" />
      <el-table-column
        prop="description"
        :label="t('dashboard.groupDesc')"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column :label="t('dashboard.dashboardCount')" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row._count?.dashboards ?? 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="140" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openGroupForm(row)">{{
            t('common.edit')
          }}</el-button>
          <el-button link type="danger" size="small" @click="handleDeleteGroup(row)">{{
            t('common.delete')
          }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.close') }}</el-button>
    </template>

    <!-- 分组表单对话框 -->
    <el-dialog
      v-model="groupFormVisible"
      :title="groupForm.id ? t('dashboard.editGroup') : t('dashboard.addGroupTitle')"
      width="420px"
      append-to-body
    >
      <el-form :model="groupForm" label-width="80px">
        <el-form-item :label="t('dashboard.nameLabel')">
          <el-input
            v-model="groupForm.name"
            :placeholder="t('dashboard.groupNamePlaceholder')"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('dashboard.groupDesc')">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="2"
            :placeholder="t('dashboard.optional')"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item :label="t('dashboard.sort')">
          <el-input-number v-model="groupForm.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupFormVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="groupSaving" @click="handleSaveGroup">{{
          t('common.save')
        }}</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  createDashboardGroup,
  updateDashboardGroup,
  deleteDashboardGroup,
} from '@/api/dashboard-group'
import type { DashboardGroup } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  groups: DashboardGroup[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 分组增删改后通知父级重新拉取分组列表 */
  refresh: []
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const groupFormVisible = ref(false)
const groupSaving = ref(false)
const groupForm = reactive<{ id: number | null; name: string; description: string; sort: number }>({
  id: null,
  name: '',
  description: '',
  sort: 0,
})

function openGroupForm(row?: DashboardGroup) {
  if (row) {
    groupForm.id = row.id
    groupForm.name = row.name
    groupForm.description = row.description || ''
    groupForm.sort = row.sort
  } else {
    groupForm.id = null
    groupForm.name = ''
    groupForm.description = ''
    groupForm.sort = 0
  }
  groupFormVisible.value = true
}

async function handleSaveGroup() {
  const name = groupForm.name.trim()
  if (!name) {
    ElMessage.warning(t('dashboard.groupNameRequired'))
    return
  }
  groupSaving.value = true
  try {
    const data = {
      name,
      description: groupForm.description.trim() || undefined,
      sort: groupForm.sort,
    }
    if (groupForm.id) {
      await updateDashboardGroup(groupForm.id, data)
      ElMessage.success(t('dashboard.updateSuccess'))
    } else {
      await createDashboardGroup(data)
      ElMessage.success(t('dashboard.createGroupSuccess'))
    }
    groupFormVisible.value = false
    emit('refresh')
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    groupSaving.value = false
  }
}

async function handleDeleteGroup(row: DashboardGroup) {
  try {
    await ElMessageBox.confirm(
      t('dashboard.deleteGroupConfirm', { name: row.name }),
      t('dashboard.deleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
      },
    )
    await deleteDashboardGroup(row.id)
    ElMessage.success(t('dashboard.deleteSuccess'))
    emit('refresh')
  } catch {
    // 用户取消或请求失败
  }
}
</script>

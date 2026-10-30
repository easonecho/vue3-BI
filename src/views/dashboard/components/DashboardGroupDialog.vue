<template>
  <el-dialog v-model="visible" title="分组管理" width="640px">
    <div style="margin-bottom: 12px">
      <el-button type="primary" size="small" @click="openGroupForm()">
        <el-icon><Plus /></el-icon>&nbsp;新增分组
      </el-button>
    </div>
    <el-table v-loading="loading" :data="groups" size="small" border>
      <el-table-column prop="name" label="分组名称" min-width="140" />
      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
      <el-table-column label="看板数" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row._count?.dashboards ?? 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openGroupForm(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDeleteGroup(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>

    <!-- 分组表单对话框 -->
    <el-dialog
      v-model="groupFormVisible"
      :title="groupForm.id ? '编辑分组' : '新增分组'"
      width="420px"
      append-to-body
    >
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="名称">
          <el-input
            v-model="groupForm.name"
            placeholder="请输入分组名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="2"
            placeholder="可选"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="groupForm.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="groupSaving" @click="handleSaveGroup">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
    ElMessage.warning('分组名称不能为空')
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
      ElMessage.success('更新成功')
    } else {
      await createDashboardGroup(data)
      ElMessage.success('创建成功')
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
    await ElMessageBox.confirm(`确定删除分组「${row.name}」吗?`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteDashboardGroup(row.id)
    ElMessage.success('删除成功')
    emit('refresh')
  } catch {
    // 用户取消或请求失败
  }
}
</script>

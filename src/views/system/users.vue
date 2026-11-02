<template>
  <div class="user-manage-page">
    <el-card class="page-card" shadow="never">
      <UserFilterBar
        v-model:keyword="filters.keyword"
        v-model:role-id="filters.roleId"
        v-model:status="filters.status"
        :role-options="roleOptions"
        @search="handleSearch"
        @reset="handleReset"
        @create="openCreateDialog"
      />

      <UserTable
        :list="list"
        :loading="loading"
        :page="page"
        :page-size="pageSize"
        :total="total"
        @edit="openEditDialog"
        @change-role="openRoleDialog"
        @reset-password="openResetPwdDialog"
        @delete="handleDelete"
        @update:page="page = $event"
        @update:page-size="pageSize = $event"
        @change="loadList"
      />
    </el-card>

    <!-- 新增/编辑 对话框 -->
    <UserFormDialog
      v-model="formDialogVisible"
      :mode="formMode"
      :user="formTarget"
      :role-options="roleOptions"
      @saved="loadList"
    />

    <!-- 改角色 对话框 -->
    <UserRoleDialog
      v-model="roleDialogVisible"
      :user="roleTarget"
      :role-options="roleOptions"
      @saved="loadList"
    />

    <!-- 重置密码 对话框：管理员无需知道原密码 -->
    <UserPasswordDialog v-model="pwdDialogVisible" :user="pwdTarget" @saved="loadList" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '@/api/types'
import UserFilterBar from './components/UserFilterBar.vue'
import UserTable from './components/UserTable.vue'
import UserFormDialog from './components/UserFormDialog.vue'
import UserRoleDialog from './components/UserRoleDialog.vue'
import UserPasswordDialog from './components/UserPasswordDialog.vue'
import { useUserManagement } from './composables/useUserManagement'

const { loading, list, total, page, pageSize, filters, roleOptions, loadList, handleSearch, handleReset, handleDelete } =
  useUserManagement()

// ---------- 新增/编辑 ----------
const formDialogVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formTarget = ref<User | null>(null)

function openCreateDialog() {
  formMode.value = 'create'
  formTarget.value = null
  formDialogVisible.value = true
}

function openEditDialog(row: User) {
  formMode.value = 'edit'
  formTarget.value = row
  formDialogVisible.value = true
}

// ---------- 改角色 ----------
const roleDialogVisible = ref(false)
const roleTarget = ref<User | null>(null)

function openRoleDialog(row: User) {
  roleTarget.value = row
  roleDialogVisible.value = true
}

// ---------- 重置密码 ----------
const pwdDialogVisible = ref(false)
const pwdTarget = ref<User | null>(null)

function openResetPwdDialog(row: User) {
  pwdTarget.value = row
  pwdDialogVisible.value = true
}
</script>

<style scoped lang="less">
.user-manage-page {
  width: 100%;
}
.page-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
</style>

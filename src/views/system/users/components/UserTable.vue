<template>
  <div class="user-table">
    <el-table v-loading="loading" :data="list" style="width: 100%; margin-top: 16px" stripe border>
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="username" :label="t('userPage.username')" min-width="120" />
      <el-table-column prop="nickname" :label="t('userPage.nickname')" min-width="110" />
      <el-table-column :label="t('userPage.role')" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.role" size="small" :type="roleTagType(row.role.code)">
            {{ row.role.name }}
          </el-tag>
          <span v-else style="color: #9ca3af">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="email" :label="t('userPage.email')" min-width="180" />
      <el-table-column prop="phone" :label="t('userPage.phone')" min-width="130" />
      <el-table-column :label="t('userPage.status')" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? t('userPage.enabled') : t('userPage.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="createdAt"
        :label="t('userPage.createdAt')"
        width="170"
        align="center"
      />
      <el-table-column :label="t('common.actions')" width="300" fixed="right" align="center">
        <template #default="{ row }">
          <el-button
            v-permission="'system:user:edit'"
            link
            type="primary"
            size="small"
            @click="emit('edit', row)"
          >
            {{ t('common.edit') }}
          </el-button>
          <el-button
            v-permission="'system:user:edit'"
            link
            type="primary"
            size="small"
            @click="emit('change-role', row)"
          >
            {{ t('userPage.changeRole') }}
          </el-button>
          <el-button
            v-permission="'system:user:edit'"
            link
            type="warning"
            size="small"
            @click="emit('reset-password', row)"
          >
            {{ t('userPage.resetPassword') }}
          </el-button>
          <el-popconfirm
            :title="t('userPage.deleteConfirm')"
            :confirm-button-text="t('common.delete')"
            :cancel-button-text="t('common.cancel')"
            confirm-button-type="danger"
            @confirm="emit('delete', row)"
          >
            <template #reference>
              <el-button v-permission="'system:user:remove'" link type="danger" size="small">{{
                t('common.delete')
              }}</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @update:current-page="(v: number) => emit('update:page', v)"
        @update:page-size="(v: number) => emit('update:pageSize', v)"
        @size-change="emit('change')"
        @current-change="emit('change')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { User } from '@/api/types'
import { roleTagType } from '../utils/user-utils'

const { t } = useI18n()

defineProps<{
  list: User[]
  loading: boolean
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  edit: [row: User]
  'change-role': [row: User]
  'reset-password': [row: User]
  delete: [row: User]
  'update:page': [page: number]
  'update:pageSize': [size: number]
  change: []
}>()
</script>

<style scoped lang="less">
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>

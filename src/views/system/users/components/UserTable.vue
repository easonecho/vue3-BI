<template>
  <div class="user-table">
    <el-table v-loading="loading" :data="list" style="width: 100%; margin-top: 16px" stripe border>
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="nickname" label="昵称" min-width="110" />
      <el-table-column label="角色" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.role" size="small" :type="roleTagType(row.role.code)">
            {{ row.role.name }}
          </el-tag>
          <span v-else style="color: #9ca3af">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="phone" label="手机号" min-width="130" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
      <el-table-column label="操作" width="300" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="emit('edit', row)">
            编辑
          </el-button>
          <el-button link type="primary" size="small" @click="emit('change-role', row)">
            改角色
          </el-button>
          <el-button link type="warning" size="small" @click="emit('reset-password', row)">
            重置密码
          </el-button>
          <el-popconfirm
            title="确定删除该用户吗?"
            confirm-button-text="删除"
            cancel-button-text="取消"
            confirm-button-type="danger"
            @confirm="emit('delete', row)"
          >
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
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
import type { User } from '@/api/types'
import { roleTagType } from '../utils/user-utils'

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

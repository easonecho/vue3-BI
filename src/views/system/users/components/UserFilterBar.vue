<template>
  <div class="filter-bar">
    <el-input
      :model-value="keyword"
      :placeholder="t('userPage.searchPlaceholder')"
      clearable
      style="width: 260px"
      :prefix-icon="Search"
      @update:model-value="(v: string) => emit('update:keyword', v)"
      @keyup.enter="emit('search')"
      @clear="emit('search')"
    />
    <el-select
      :model-value="roleId"
      :placeholder="t('userPage.roleFilter')"
      clearable
      style="width: 180px"
      @update:model-value="(v: number | undefined) => emit('update:roleId', v)"
      @change="emit('search')"
    >
      <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
    </el-select>
    <el-select
      :model-value="status"
      :placeholder="t('userPage.statusFilter')"
      clearable
      style="width: 140px"
      @update:model-value="(v: number | undefined) => emit('update:status', v)"
      @change="emit('search')"
    >
      <el-option :label="t('userPage.enabled')" :value="1" />
      <el-option :label="t('userPage.disabled')" :value="0" />
    </el-select>
    <el-button type="primary" @click="emit('search')">
      <el-icon><Search /></el-icon>&nbsp;{{ t('userPage.query') }}
    </el-button>
    <el-button @click="emit('reset')">
      <el-icon><Refresh /></el-icon>&nbsp;{{ t('common.reset') }}
    </el-button>
    <div class="spacer" />
    <el-button v-permission="'system:user:add'" type="success" @click="emit('create')">
      <el-icon><Plus /></el-icon>&nbsp;{{ t('userPage.create') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import type { Role } from '@/api/types'

const { t } = useI18n()

defineProps<{
  keyword?: string
  roleId?: number
  status?: number
  roleOptions: Role[]
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:roleId': [value: number | undefined]
  'update:status': [value: number | undefined]
  search: []
  reset: []
  create: []
}>()
</script>

<style scoped lang="less">
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  .spacer {
    flex: 1;
    min-width: 4px;
  }
}
</style>

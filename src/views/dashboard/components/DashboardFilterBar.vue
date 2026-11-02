<template>
  <div class="filter-card">
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索看板名称/描述"
        clearable
        style="width: 240px"
        :prefix-icon="Search"
        @keyup.enter="emit('search')"
        @clear="emit('search')"
      />
      <el-select
        v-model="status"
        placeholder="按状态筛选"
        clearable
        style="width: 140px"
        @change="emit('search')"
      >
        <el-option label="已发布" :value="1" />
        <el-option label="草稿" :value="0" />
      </el-select>
      <el-select
        v-model="isPublic"
        placeholder="按公开性筛选"
        clearable
        style="width: 140px"
        @change="emit('search')"
      >
        <el-option label="公开" :value="true" />
        <el-option label="私有" :value="false" />
      </el-select>
      <!-- P2-3: 分组筛选 -->
      <el-select
        v-model="groupFilter"
        placeholder="按分组筛选"
        clearable
        style="width: 160px"
        @change="emit('search')"
      >
        <el-option label="未分组" :value="'ungrouped'" />
        <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
      </el-select>
      <el-button type="primary" @click="emit('search')">
        <el-icon><Search /></el-icon>&nbsp;查询
      </el-button>
      <el-button @click="emit('reset')">
        <el-icon><Refresh /></el-icon>&nbsp;重置
      </el-button>
      <el-button :type="onlyFavorites ? 'warning' : 'default'" @click="emit('toggle-favorites')">
        <el-icon><component :is="onlyFavorites ? StarFilled : Star" /></el-icon
        >&nbsp;我的收藏
      </el-button>
      <div class="spacer" />
      <!-- P2-3: 分组管理 + 模板库 -->
      <el-button @click="emit('group-manage')">
        <el-icon><FolderOpened /></el-icon>&nbsp;{{ t('dashboard.groupManage') }}
      </el-button>
      <el-button type="success" @click="emit('create')">
        <el-icon><Plus /></el-icon>&nbsp;新建看板
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus, Search, Refresh, Star, StarFilled, FolderOpened } from '@element-plus/icons-vue'
import type { DashboardGroup } from '@/api/types'

defineProps<{
  groups: DashboardGroup[]
}>()

const emit = defineEmits<{
  search: []
  reset: []
  'toggle-favorites': []
  'group-manage': []
  create: []
}>()

const keyword = defineModel<string>('keyword', { required: true })
const status = defineModel<number | undefined>('status')
const isPublic = defineModel<boolean | undefined>('isPublic')
const onlyFavorites = defineModel<boolean>('onlyFavorites', { required: true })
const groupFilter = defineModel<number | 'ungrouped' | undefined>('groupFilter')

const { t } = useI18n()
</script>

<style scoped lang="less">
/* 筛选栏 */
.filter-card {
  position: relative;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-card-border);
  box-shadow: var(--bi-shadow-sm);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .spacer {
    flex: 1;
  }
}

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .filter-bar {
    gap: 8px;

    :deep(.el-input),
    :deep(.el-select) {
      width: 100% !important;
    }

    .spacer {
      display: none;
    }

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
}
</style>

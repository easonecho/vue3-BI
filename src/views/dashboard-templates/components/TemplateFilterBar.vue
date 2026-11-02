<template>
  <div class="filter-card">
    <!-- 分类 Tab: 全部 / 预置模板 / 用户模板 -->
    <el-tabs v-model="activeTab" class="category-tabs" @tab-change="emit('tab-change')">
      <el-tab-pane :label="t('templateManage.tabAll')" name="all" />
      <el-tab-pane :label="t('templateManage.tabPreset')" name="preset" />
      <el-tab-pane :label="t('templateManage.tabUser')" name="user" />
    </el-tabs>
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        :placeholder="t('templateManage.searchPlaceholder')"
        clearable
        style="width: 240px"
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-select
        v-model="category"
        :placeholder="t('templateManage.categoryFilter')"
        clearable
        style="width: 160px"
        @change="handleSearch"
      >
        <el-option v-for="c in categoryOptions" :key="c.value" :label="t(c.i18nKey)" :value="c.value" />
      </el-select>
      <el-select
        v-model="isPublic"
        :placeholder="t('templateManage.publicFilter')"
        clearable
        style="width: 140px"
        @change="handleSearch"
      >
        <el-option :label="t('dashboard.public')" :value="true" />
        <el-option :label="t('dashboard.private')" :value="false" />
      </el-select>
      <!-- 排序 (P2-4) -->
      <el-select v-model="sort" style="width: 140px" @change="handleSearch">
        <el-option :label="t('templateManage.sortUpdated')" value="updated" />
        <el-option :label="t('templateManage.sortCreated')" value="created" />
        <el-option :label="t('templateManage.sortName')" value="name" />
      </el-select>
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>&nbsp;{{ t('common.search') }}
      </el-button>
      <el-button @click="emit('reset')">
        <el-icon><Refresh /></el-icon>&nbsp;{{ t('common.reset') }}
      </el-button>
      <div class="spacer" />
      <!-- 预置模板 Tab 下隐藏「新建模板」按钮 (预置模板由系统维护) -->
      <el-button v-if="activeTab !== 'preset'" type="success" @click="emit('create')">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('templateManage.create') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import type { TemplateCategoryOption } from '@/api/dashboard-template'
import type { TemplateSort, TemplateTab } from '../composables/useTemplateList'

defineProps<{
  categoryOptions: TemplateCategoryOption[]
}>()

const emit = defineEmits<{
  'tab-change': []
  search: []
  reset: []
  create: []
}>()

const activeTab = defineModel<TemplateTab>('activeTab', { required: true })
const keyword = defineModel<string>('keyword', { required: true })
const category = defineModel<string | undefined>('category')
const isPublic = defineModel<boolean | undefined>('isPublic')
const sort = defineModel<TemplateSort>('sort', { required: true })

const { t } = useI18n()

/** 客户端过滤由父级 filteredList 自动响应；此处仅保留按钮/回车/清空触发点 */
function handleSearch() {
  emit('search')
}
</script>

<style scoped lang="less">
.filter-card {
  position: relative;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-card-border);
  box-shadow: var(--bi-shadow-sm);
}

.category-tabs {
  margin-bottom: 12px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: var(--bi-border-color);
  }
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
</style>

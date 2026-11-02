<template>
  <div class="tpl-page">
    <!-- 页面头部 -->
    <TemplatePageHeader
      :total="total"
      :preset-count="presetCount"
      :user-count="userCount"
    />

    <!-- 顶部筛选栏 -->
    <TemplateFilterBar
      v-model:active-tab="activeTab"
      v-model:keyword="filters.keyword"
      v-model:category="filters.category"
      v-model:is-public="filters.isPublic"
      v-model:sort="filters.sort"
      :category-options="categories"
      @tab-change="handleTabChange"
      @search="handleSearch"
      @reset="resetFilters"
      @create="openCreate"
    />

    <!-- 模板卡片网格 + 空状态 -->
    <TemplateGrid
      :items="sortedList"
      :loading="loading"
      :empty="filteredList.length === 0"
      :category-options="categories"
      @apply="openApply"
      @preview="navigatePreview"
      @edit="openEdit"
      @command="handleCommand"
      @create="openCreate"
    />

    <!-- 应用模板创建看板对话框 -->
    <ApplyTemplateDialog
      v-model="applyVisible"
      :item="applyTarget"
      :loading="applying"
      @confirm="confirmApply"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TemplatePageHeader from './components/TemplatePageHeader.vue'
import TemplateFilterBar from './components/TemplateFilterBar.vue'
import TemplateGrid from './components/TemplateGrid.vue'
import ApplyTemplateDialog from './components/ApplyTemplateDialog.vue'
import { useTemplatePage } from './composables/useTemplatePage'
import type { TemplateTranslate } from './composables/useTemplateActions'

const router = useRouter()
const { t } = useI18n()

/** 注入给 composable 的翻译函数（保持最小签名，避免 i18n 重载类型外溢） */
const translate: TemplateTranslate = (key, named) => (named ? t(key, named) : t(key))

const {
  categories,
  loading,
  total,
  presetCount,
  userCount,
  activeTab,
  filters,
  filteredList,
  sortedList,
  handleTabChange,
  resetFilters,
  applyVisible,
  applying,
  applyTarget,
  openApply,
  confirmApply,
  openCreate,
  openEdit,
  handleCommand,
  handleSearch,
  navigatePreview,
  init,
} = useTemplatePage({ router, t: translate })

onMounted(init)
</script>

<style scoped lang="less">
.tpl-page {
  padding: 16px;
}
</style>

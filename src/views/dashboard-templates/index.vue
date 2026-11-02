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

    <!-- 模板卡片网格 -->
    <el-row v-loading="loading" :gutter="16" class="card-grid">
      <el-col
        v-for="(item, idx) in sortedList"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <TemplateCard
          :item="item"
          :index="idx"
          :category-text="categoryLabel(item.category)"
          @apply="openApply"
          @preview="navigatePreview"
          @edit="openEdit"
          @command="handleCommand"
        />
      </el-col>

      <el-col v-if="!loading && filteredList.length === 0" :span="24">
        <div class="empty-state">
          <el-empty :description="t('templateManage.empty')">
            <el-button type="primary" @click="openCreate">
              {{ t('templateManage.create') }}
            </el-button>
          </el-empty>
        </div>
      </el-col>
    </el-row>

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
import type { DashboardTemplate } from '@/api/dashboard-template'
import TemplatePageHeader from './components/TemplatePageHeader.vue'
import TemplateFilterBar from './components/TemplateFilterBar.vue'
import TemplateCard from './components/TemplateCard.vue'
import ApplyTemplateDialog from './components/ApplyTemplateDialog.vue'
import { useTemplateList } from './composables/useTemplateList'
import { useTemplateActions, type TemplateTranslate } from './composables/useTemplateActions'
import { useTemplateApply } from './composables/useTemplateApply'

const router = useRouter()
const { t } = useI18n()

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
  loadList,
  loadCategories,
  handleTabChange,
  resetFilters,
} = useTemplateList()

/** 注入给 composable 的翻译函数（保持最小签名，避免 i18n 重载类型外溢） */
const translate: TemplateTranslate = (key, named) => (named ? t(key, named) : t(key))

const { applyVisible, applying, applyTarget, openApply, confirmApply } = useTemplateApply({
  router,
  t: translate,
})

const { openCreate, openEdit, handleCommand } = useTemplateActions({
  router,
  t: translate,
  reload: loadList,
  openApply,
})

/** 客户端过滤由 filteredList computed 自动响应，此处仅保留触发点 */
function handleSearch() {}

/** 根据 category value 获取本地化显示文本 */
function categoryLabel(value?: string | null): string {
  if (!value) return ''
  const opt = categories.value.find((c) => c.value === value)
  return opt ? t(opt.i18nKey) : value
}

function navigatePreview(item: DashboardTemplate) {
  router.push(`/preview-template/${item.id}`)
}

onMounted(() => {
  loadList()
  loadCategories()
})
</script>

<style scoped lang="less">
.tpl-page {
  padding: 16px;
}

/* 卡片网格 */
.card-grid {
  min-height: 200px;
}

.empty-state {
  padding: 40px 0;
}

:deep(.el-empty__description) {
  color: var(--bi-text-secondary);
}
</style>

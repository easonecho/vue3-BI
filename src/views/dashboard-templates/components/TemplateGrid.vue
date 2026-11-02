<template>
  <el-row v-loading="loading" :gutter="16" class="card-grid">
    <el-col
      v-for="(item, idx) in items"
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
        @apply="emit('apply', $event)"
        @preview="emit('preview', $event)"
        @edit="emit('edit', $event)"
        @command="onCommand"
      />
    </el-col>

    <el-col v-if="!loading && empty" :span="24">
      <div class="empty-state">
        <el-empty :description="t('templateManage.empty')">
          <el-button type="primary" @click="emit('create')">
            {{ t('templateManage.create') }}
          </el-button>
        </el-empty>
      </div>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardTemplate, TemplateCategoryOption } from '@/api/dashboard-template'
import TemplateCard from './TemplateCard.vue'

const props = defineProps<{
  items: DashboardTemplate[]
  loading: boolean
  empty: boolean
  categoryOptions: TemplateCategoryOption[]
}>()

const emit = defineEmits<{
  apply: [DashboardTemplate]
  preview: [DashboardTemplate]
  edit: [DashboardTemplate]
  command: [string, DashboardTemplate]
  create: []
}>()

const { t } = useI18n()

/** 根据 category value 获取本地化显示文本，未匹配时回退原始值 */
function categoryLabel(value?: string | null): string {
  if (!value) return ''
  const opt = props.categoryOptions.find((c) => c.value === value)
  return opt ? t(opt.i18nKey) : value
}

function onCommand(cmd: string, item: DashboardTemplate) {
  emit('command', cmd, item)
}
</script>

<style scoped lang="less">
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

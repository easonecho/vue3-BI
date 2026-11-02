<template>
  <el-row v-loading="loading" :gutter="16" class="card-grid">
    <el-col v-for="(item, idx) in items" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
      <DashboardCard
        :item="item"
        :index="idx"
        :favorited="isFavorited(item)"
        @preview="emit('preview', $event)"
        @edit="emit('edit', $event)"
        @toggle-favorite="emit('toggle-favorite', $event)"
        @command="onCommand"
      />
    </el-col>

    <el-col v-if="!loading && items.length === 0" :span="24">
      <div class="empty-state">
        <el-empty description="暂无看板,点击右上角新建">
          <el-button type="primary" @click="emit('create')">新建看板</el-button>
        </el-empty>
      </div>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import type { Dashboard } from '@/api/types'
import DashboardCard from './DashboardCard.vue'

defineProps<{
  items: Dashboard[]
  loading: boolean
}>()

const emit = defineEmits<{
  preview: [id: number]
  edit: [id: number]
  'toggle-favorite': [item: Dashboard]
  command: [cmd: string, item: Dashboard]
  create: []
}>()

/** 当前用户是否已收藏（favorites 有值即视为已收藏） */
function isFavorited(item: Dashboard): boolean {
  return !!(item.favorites && item.favorites.length > 0)
}

function onCommand(cmd: string, item: Dashboard) {
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

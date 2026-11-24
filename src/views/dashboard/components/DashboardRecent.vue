<template>
  <section v-if="items.length" class="recent-bar" :aria-label="t('dashboard.recentAriaLabel')">
    <span class="recent-label">
      <el-icon><Clock /></el-icon>
      {{ t('dashboard.recentVisited') }}
    </span>
    <div class="recent-list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="recent-item"
        :title="item.name"
        @click="emit('open', item.id)"
      >
        <span class="recent-name">{{ item.name }}</span>
        <span class="recent-time">{{ formatRecentTime(item.visitedAt) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Clock } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { formatRecentTime, type RecentDashboard } from '@/utils/recent-dashboards'

defineProps<{ items: RecentDashboard[] }>()

const emit = defineEmits<{ open: [id: number] }>()

const { t } = useI18n()
</script>

<style scoped lang="less">
.recent-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-border-color);
  border-radius: 8px;
}

.recent-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--bi-text-muted);
}

.recent-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.recent-item {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
  max-width: 220px;
  padding: 4px 10px;
  border: 1px solid var(--bi-border-color);
  border-radius: 999px;
  background: transparent;
  color: var(--bi-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: var(--bi-accent);
    border-color: var(--bi-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--bi-accent);
    outline-offset: 2px;
  }
}

.recent-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-time {
  flex-shrink: 0;
  color: var(--bi-text-muted);
  font-size: 11px;
}

@media (max-width: 768px) {
  .recent-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .recent-list {
    width: 100%;
  }
}
</style>

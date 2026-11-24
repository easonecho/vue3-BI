<template>
  <div class="page-header">
    <div class="header-title-area">
      <h1 class="page-title">{{ t('dashboard.title') }}</h1>
      <p class="page-subtitle">{{ t('dashboard.subtitle', { count: total }) }}</p>
    </div>
    <div class="header-stats">
      <div class="stat-chip">
        <span class="stat-value">{{ total }}</span>
        <span class="stat-label">{{ t('dashboard.total') }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{{ publishedCount }}</span>
        <span class="stat-label">{{ t('dashboard.published') }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{{ draftCount }}</span>
        <span class="stat-label">{{ t('dashboard.draft') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  total: number
  publishedCount: number
  draftCount: number
}>()

const { t } = useI18n()
</script>

<style scoped lang="less">
/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title-area {
  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--bi-text-primary);
    margin: 0;
    line-height: 1.3;
  }
  .page-subtitle {
    font-size: 13px;
    color: var(--bi-text-muted);
    margin: 4px 0 0 0;
  }
}

.header-stats {
  display: flex;
  gap: 10px;

  .stat-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 16px;
    border-radius: 8px;
    background: var(--bi-card-bg);
    border: 1px solid var(--bi-card-border);
    min-width: 64px;

    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--bi-accent);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-size: 10px;
      letter-spacing: 1px;
      color: var(--bi-text-muted);
      margin-top: 2px;
    }
  }
}

/* ========== 移动端适配：统计卡片均分整行 ========== */
@media (max-width: 768px) {
  .page-header {
    gap: 12px;
  }

  .header-stats {
    width: 100%;
    gap: 8px;

    .stat-chip {
      flex: 1;
      min-width: 0;
      padding: 6px 8px;
    }
  }
}
</style>

<template>
  <div class="page-header">
    <div class="header-title-area">
      <h1 class="page-title">{{ t('templateManage.title') }}</h1>
      <p class="page-subtitle">{{ t('templateManage.subtitle', { count: total }) }}</p>
    </div>
    <div class="header-stats">
      <div class="stat-chip">
        <span class="stat-value">{{ total }}</span>
        <span class="stat-label">{{ t('templateManage.statTotal') }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{{ presetCount }}</span>
        <span class="stat-label">{{ t('templateManage.statPreset') }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{{ userCount }}</span>
        <span class="stat-label">{{ t('templateManage.statUser') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  total: number
  presetCount: number
  userCount: number
}>()

const { t } = useI18n()
</script>

<style scoped lang="less">
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
</style>

<template>
  <div class="page-header">
    <div class="header-title-area">
      <h1 class="page-title">看板管理</h1>
      <p class="page-subtitle">共 {{ total }} 个看板</p>
    </div>
    <div class="header-stats">
      <div class="stat-chip">
        <span class="stat-value">{{ total }}</span>
        <span class="stat-label">总计</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{{ publishedCount }}</span>
        <span class="stat-label">已发布</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{{ draftCount }}</span>
        <span class="stat-label">草稿</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  total: number
  publishedCount: number
  draftCount: number
}>()
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
</style>

<template>
  <div class="panel">
    <div class="panel__title">目标达成率</div>
    <div class="rate-grid">
      <div v-for="r in rates" :key="r.label" class="rate-item">
        <div class="rate-item__top">
          <span>{{ r.label }}</span>
          <span class="rate-num">{{ r.value.toFixed(1) }}%</span>
        </div>
        <el-progress :percentage="r.value" :stroke-width="10" :color="r.color" :show-text="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RateItem } from '../composables/useScreenDashboard'

defineProps<{
  rates: RateItem[]
}>()
</script>

<style scoped lang="less">
.panel {
  position: relative;
  padding: 18px 14px 14px;
  border: 1px solid rgba(0, 234, 255, 0.25);
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(14, 24, 50, 0.85), rgba(12, 18, 38, 0.85));
  box-shadow: 0 0 24px rgba(0, 200, 255, 0.12) inset;
  &__title {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 22px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 2px;
    color: #e0f7ff;
    background: linear-gradient(90deg, rgba(0, 234, 255, 0.08), rgba(0, 234, 255, 0.28), rgba(0, 234, 255, 0.08));
    border: 1px solid rgba(0, 234, 255, 0.35);
    border-radius: 3px;
  }
}
.rate-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 4px;
  .rate-item__top {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #cfe4ff;
    .rate-num {
      color: var(--c-accent, #00eaff);
      font-size: 15px;
    }
  }
}
</style>

<template>
  <section class="screen-kpi">
    <div v-for="k in kpis" :key="k.label" class="kpi-card">
      <div class="kpi-card__label">{{ k.label }}</div>
      <div class="kpi-card__num" :style="{ color: k.color }">
        {{ k.value }}<span class="kpi-unit">{{ k.unit }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { KpiItem } from '../utils/screen-data'

defineProps<{
  kpis: KpiItem[]
}>()
</script>

<style scoped lang="less">
.screen-kpi {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  padding: 14px;
}
.kpi-card {
  padding: 14px 18px;
  border-radius: 4px;
  border: 1px solid rgba(0, 234, 255, 0.22);
  background: linear-gradient(135deg, rgba(14, 30, 62, 0.85), rgba(12, 20, 40, 0.85));
  box-shadow: 0 0 18px rgba(0, 180, 255, 0.1) inset;
  &__label {
    font-size: 13px;
    color: #9fc3e8;
  }
  &__num {
    font-size: 32px;
    font-weight: 700;
    margin-top: 6px;
    text-shadow: 0 0 12px currentColor;
    .kpi-unit {
      font-size: 14px;
      font-weight: 400;
      opacity: 0.75;
      margin-left: 4px;
      text-shadow: none;
    }
  }
}
</style>

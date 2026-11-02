<template>
  <div class="panel">
    <div class="panel__title">实时榜单 TOP 8</div>
    <div class="ranking">
      <div v-for="(row, i) in ranking" :key="row.name" class="ranking__row">
        <div class="ranking__rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</div>
        <div class="ranking__name">{{ row.name }}</div>
        <div class="ranking__bar"><div class="ranking__bar-inner" :style="{ width: row.percent + '%' }" /></div>
        <div class="ranking__val">{{ formatK(row.value) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RankingItem } from '../composables/useScreenDashboard'
import { formatK } from '../utils/screen-utils'

defineProps<{
  ranking: RankingItem[]
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
.ranking {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 2px;
  &__row {
    display: grid;
    grid-template-columns: 32px 80px 1fr 70px;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
  &__rank {
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    border-radius: 4px;
    background: rgba(111, 166, 255, 0.12);
    color: #cfe4ff;
    font-weight: 600;
    font-size: 12px;
    &.rank-1 {
      background: linear-gradient(135deg, #f87171, #f97316);
      color: #fff;
    }
    &.rank-2 {
      background: linear-gradient(135deg, #fb923c, #f7c365);
      color: #fff;
    }
    &.rank-3 {
      background: linear-gradient(135deg, #f7c365, #eab308);
      color: #2b1f00;
    }
  }
  &__name {
    color: #cfe4ff;
  }
  &__bar {
    height: 8px;
    background: rgba(111, 166, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  &__bar-inner {
    height: 100%;
    border-radius: 4px;
    background: #00eaff;
    transition: width 0.6s;
    box-shadow: 0 0 6px currentColor;
  }
  &__val {
    color: #9fc3e8;
    text-align: right;
    font-size: 14px;
  }
}
</style>

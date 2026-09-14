<template>
  <div class="widget-rank-list" :style="containerStyle">
    <div v-if="showTitle" class="widget-rank-list__title" :style="titleStyle">{{ title }}</div>
    <div class="widget-rank-list__list">
      <div v-for="(item, idx) in list" :key="idx" class="widget-rank-list__row">
        <div class="widget-rank-list__row-head">
          <span class="widget-rank-list__rank" :style="rankStyle(idx)">{{ idx + 1 }}</span>
          <span class="widget-rank-list__name" :style="nameStyle">{{ item.name }}</span>
          <span class="widget-rank-list__value" :style="valueStyle">{{ item.value }}</span>
        </div>
        <div class="widget-rank-list__bar-track" :style="barTrackStyle">
          <div class="widget-rank-list__bar-fill" :style="barFillStyle(item.value)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const title = computed(() => props.comp.props?.title ?? '排行榜')
const showTitle = computed(() => props.comp.props?.showTitle ?? true)
const top = computed(() => props.comp.props?.top ?? 5)
const barColor = computed(() => props.comp.props?.barColor ?? '#22d3ee')
const barBgColor = computed(() => props.comp.props?.barBgColor ?? '#1e293b')
const fontSize = computed(() => props.comp.props?.fontSize ?? 12)
const nameColor = computed(() => props.comp.props?.nameColor ?? '#e2e8f0')
const valueColor = computed(() => props.comp.props?.valueColor ?? '#67e8f9')
const rankColorsStr = computed(() => props.comp.props?.rankColors ?? '#fbbf24, #94a3b8, #b45309')

interface RankItem {
  name: string
  value: number
}

const items = computed<RankItem[]>(() => {
  const raw = props.comp.props?.items
  return Array.isArray(raw) ? (raw as RankItem[]) : []
})

const list = computed(() => items.value.slice(0, Math.max(1, Number(top.value) || 1)))

const maxValue = computed(() => {
  if (list.value.length === 0) return 1
  return Math.max(...list.value.map((i) => Number(i.value) || 0), 1)
})

const rankColorArr = computed(() =>
  String(rankColorsStr.value || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean),
)

const containerStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
}))

const titleStyle = computed(() => ({
  fontSize: `${fontSize.value + 2}px`,
  color: nameColor.value,
  fontWeight: 'bold',
}))

const nameStyle = computed(() => ({
  color: nameColor.value,
}))

const valueStyle = computed(() => ({
  color: valueColor.value,
  fontVariantNumeric: 'tabular-nums',
}))

const barTrackStyle = computed(() => ({
  background: barBgColor.value,
}))

function rankStyle(idx: number) {
  if (idx < rankColorArr.value.length) {
    const color = rankColorArr.value[idx]
    return {
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      color: '#0f172a',
    }
  }
  return {
    background: '#475569',
    color: '#e2e8f0',
  }
}

function barFillStyle(v: number) {
  const pct = Math.max(0, Math.min(100, (Number(v) / maxValue.value) * 100))
  return {
    width: `${pct}%`,
    background: barColor.value,
  }
}
</script>

<style scoped lang="less">
.widget-rank-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  user-select: none;
  padding: 8px;

  &__title {
    flex-shrink: 0;
    margin-bottom: 8px;
  }

  &__list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__row-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__rank {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
  }

  &__name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__value {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  &__bar-track {
    height: 4px;
    border-radius: 2px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}
</style>

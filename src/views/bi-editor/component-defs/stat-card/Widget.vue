<template>
  <div class="widget-stat-card" :style="containerStyle">
    <div class="widget-stat-card__main">
      <div class="widget-stat-card__title" :style="titleStyle">{{ title }}</div>
      <div class="widget-stat-card__value-row">
        <span v-if="prefix" class="widget-stat-card__prefix">{{ prefix }}</span>
        <span class="widget-stat-card__value" :style="valueStyle">{{ value }}</span>
        <span v-if="suffix" class="widget-stat-card__suffix">{{ suffix }}</span>
      </div>
      <div v-if="trendValue" class="widget-stat-card__trend" :style="trendStyle">
        <span class="widget-stat-card__trend-arrow">{{ trendArrow }}</span>
        <span>{{ trendValue }}</span>
      </div>
    </div>
    <div v-if="showIcon" class="widget-stat-card__icon" :style="iconWrapperStyle">
      <el-icon :size="iconSize" :color="accentColor">
        <component :is="iconComp" />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import { useMetricAggregation } from '../../composables/useMetricAggregation'

const props = defineProps<{ comp: ComponentInstance }>()

/** 🔑 数据集绑定: 统计卡取一个全局聚合指标, 未绑定/未配置时回退静态值 */
const dataSource = computed(() => props.comp.dataSource)
const dataConfig = computed(() => props.comp.dataConfig ?? {})
const metricRequest = useMetricAggregation(props.comp, {
  field: () => String(dataConfig.value.valueField || '') || undefined,
  aggregate: () => String(props.comp.props?.aggregate ?? 'sum'),
})
const { rows: datasetRows } = useDatasetBinding(dataSource, true, metricRequest)

function formatMetricValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }
  return String(v)
}

const boundValue = computed<unknown>(() => {
  if (!props.comp.dataSource?.datasetId) return undefined
  const rows = datasetRows.value
  if (rows.length === 0) return undefined
  const field = String(dataConfig.value.valueField || '')
  const first = rows[0]
  if (field && first?.[field] !== undefined) return first[field]
  if (first?.value !== undefined) return first.value
  return undefined
})

const title = computed(() => props.comp.props?.title ?? '总销售额')
const value = computed(() =>
  boundValue.value !== undefined
    ? formatMetricValue(boundValue.value)
    : props.comp.props?.value ?? '¥126,560',
)
const prefix = computed(() => props.comp.props?.prefix ?? '')
const suffix = computed(() => props.comp.props?.suffix ?? '')
const trend = computed(() => props.comp.props?.trend ?? 'up')
const trendValue = computed(() => props.comp.props?.trendValue ?? '+12.5%')
const iconName = computed(() => props.comp.props?.iconName ?? 'TrendCharts')
const bgColor = computed(() => props.comp.props?.bgColor ?? '#ffffff')
const textColor = computed(() => props.comp.props?.textColor ?? '#1f2937')
const titleColor = computed(() => props.comp.props?.titleColor ?? '#6b7280')
const accentColor = computed(() => props.comp.props?.accentColor ?? '#5470c6')
const fontSize = computed(() => props.comp.props?.fontSize ?? 24)
const borderRadius = computed(() => props.comp.props?.borderRadius ?? 8)
const showIcon = computed(() => props.comp.props?.showIcon ?? true)

// 图标大小相对数值字号放大
const iconSize = computed(() => Math.round(fontSize.value * 1.5))

// 动态解析图标组件；名字不存在时 fallback 显示 Histogram
const iconComp = computed(() => {
  const name = iconName.value as keyof typeof ElementPlusIconsVue
  return ElementPlusIconsVue[name] ?? ElementPlusIconsVue.Histogram
})

const trendArrow = computed(() => {
  if (trend.value === 'up') return '↑'
  if (trend.value === 'down') return '↓'
  return '—'
})

const trendColor = computed(() => {
  if (trend.value === 'up') return '#16a34a'
  if (trend.value === 'down') return '#dc2626'
  return '#6b7280'
})

const containerStyle = computed(() => ({
  background: bgColor.value,
  borderRadius: `${borderRadius.value}px`,
  color: textColor.value,
}))

const titleStyle = computed(() => ({
  color: titleColor.value,
  fontSize: '14px',
}))

const valueStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  fontWeight: 'bold' as const,
  color: textColor.value,
  fontVariantNumeric: 'tabular-nums' as const,
}))

const trendStyle = computed(() => ({
  color: trendColor.value,
  fontSize: '12px',
}))

const iconWrapperStyle = computed(() => ({
  color: accentColor.value,
}))
</script>

<style scoped lang="less">
.widget-stat-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  box-sizing: border-box;
  overflow: hidden;
  user-select: none;

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__value-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__prefix,
  &__suffix {
    font-size: 0.6em;
    color: #6b7280;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>

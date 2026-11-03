<template>
  <div class="widget-kpi-card" :style="containerStyle">
    <!-- 顶部标题 -->
    <div class="widget-kpi-card__title" :style="titleStyle">{{ title }}</div>

    <!-- 中部：主数值 + 趋势 -->
    <div class="widget-kpi-card__main-row">
      <div class="widget-kpi-card__value-col">
        <div class="widget-kpi-card__value-line">
          <span class="widget-kpi-card__value" :style="valueStyle">{{ value }}</span>
          <span v-if="unit" class="widget-kpi-card__unit" :style="unitStyle">{{ unit }}</span>
        </div>
        <div v-if="trendValue" class="widget-kpi-card__trend" :style="trendStyle">
          <span class="widget-kpi-card__trend-arrow">{{ trendArrow }}</span>
          <span class="widget-kpi-card__trend-value">{{ trendValue }}</span>
          <span v-if="trendLabel" class="widget-kpi-card__trend-label">{{ trendLabel }}</span>
        </div>
      </div>
      <!-- 右侧 spark 折线 -->
      <canvas
        v-if="showSpark"
        ref="sparkCanvasRef"
        class="widget-kpi-card__spark"
        :style="sparkStyle"
      />
    </div>

    <!-- 底部：达成率进度条 -->
    <div v-if="showProgress" class="widget-kpi-card__progress-wrap">
      <div class="widget-kpi-card__progress-info">
        <span class="widget-kpi-card__progress-label" :style="progressLabelStyle">达成率</span>
        <span class="widget-kpi-card__progress-value" :style="progressValueStyle">
          {{ achievementText }}
        </span>
      </div>
      <div class="widget-kpi-card__progress-track" :style="progressTrackStyle">
        <div class="widget-kpi-card__progress-fill" :style="progressFillStyle" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import { useMetricAggregation } from '../../composables/useMetricAggregation'

const props = defineProps<{ comp: ComponentInstance }>()

/** 🔑 数据集绑定: KPI 只取一个全局聚合指标 (未绑定/未配置时回退静态值) */
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

/** 数据集绑定后的数值: 聚合结果别名 value, 原始行取 valueField */
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

// ============ 字段读取 ============
const title = computed(() => props.comp.props?.title ?? '月度营收')
const value = computed(() =>
  boundValue.value !== undefined ? formatMetricValue(boundValue.value) : props.comp.props?.value ?? '¥1,256,800',
)
const target = computed(() => props.comp.props?.target ?? '¥1,500,000')
const unit = computed(() => props.comp.props?.unit ?? '')
const trend = computed(() => props.comp.props?.trend ?? 'up')
const trendValue = computed(() => props.comp.props?.trendValue ?? '+12.5%')
const trendLabel = computed(() => props.comp.props?.trendLabel ?? '同比')
const sparkData = computed<number[]>(() => {
  const boundField = String(dataConfig.value.sparkField || '')
  if (props.comp.dataSource?.datasetId && boundField && datasetRows.value.length > 0) {
    return datasetRows.value
      .map((row) => Number(row[boundField]))
      .filter((n) => Number.isFinite(n))
  }
  const raw = props.comp.props?.sparkData
  if (!Array.isArray(raw)) return []
  return raw.map((n: any) => Number(n)).filter((n) => !Number.isNaN(n))
})
const showProgress = computed(() => props.comp.props?.showProgress ?? true)
const showSpark = computed(() => props.comp.props?.showSpark ?? true)
const bgColor = computed(() => props.comp.props?.bgColor ?? '#fff')
const textColor = computed(() => props.comp.props?.textColor ?? '#1f2937')
const titleColor = computed(() => props.comp.props?.titleColor ?? '#6b7280')
const accentColor = computed(() => props.comp.props?.accentColor ?? '#5470c6')
const trendUpColor = computed(() => props.comp.props?.trendUpColor ?? '#2ec07e')
const trendDownColor = computed(() => props.comp.props?.trendDownColor ?? '#ee6666')
const progressColor = computed(() => props.comp.props?.progressColor ?? '#5470c6')
const fontSize = computed(() => Number(props.comp.props?.fontSize ?? 28))
const borderRadius = computed(() => Number(props.comp.props?.borderRadius ?? 8))

// ============ 从字符串提取数字（去除 ¥/逗号/百分号/单位等） ============
function extractNumber(str: string): number {
  if (typeof str === 'number') return Number(str) || 0
  if (!str) return 0
  // 移除所有非数字非小数点非减号字符
  const cleaned = String(str).replace(/[^0-9.-]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

// ============ 达成率 ============
const achievement = computed(() => {
  const v = extractNumber(value.value)
  const t = extractNumber(target.value)
  if (t <= 0) return 0
  return (v / t) * 100
})

const achievementText = computed(() => {
  const pct = Math.max(0, Math.min(999, achievement.value))
  return `${pct.toFixed(1)}%`
})

const achievementFillPct = computed(() => {
  // 进度条最大 100%
  return Math.max(0, Math.min(100, achievement.value))
})

// ============ 趋势箭头与颜色 ============
const trendArrow = computed(() => {
  if (trend.value === 'up') return '↑'
  if (trend.value === 'down') return '↓'
  return '—'
})

const trendColor = computed(() => {
  if (trend.value === 'up') return trendUpColor.value
  if (trend.value === 'down') return trendDownColor.value
  return titleColor.value
})

// ============ 样式 ============
const containerStyle = computed(() => ({
  background: bgColor.value,
  borderRadius: `${borderRadius.value}px`,
  color: textColor.value,
}))

const titleStyle = computed(() => ({
  color: titleColor.value,
  fontSize: '13px',
}))

const valueStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  fontWeight: 'bold' as const,
  color: textColor.value,
  fontVariantNumeric: 'tabular-nums' as const,
  lineHeight: 1.1,
}))

const unitStyle = computed(() => ({
  color: titleColor.value,
  fontSize: `${Math.max(12, Math.round(fontSize.value * 0.4))}px`,
  marginLeft: '4px',
}))

const trendStyle = computed(() => ({
  color: trendColor.value,
  fontSize: '12px',
}))

const sparkStyle = computed(() => ({
  borderColor: accentColor.value,
}))

const progressLabelStyle = computed(() => ({
  color: titleColor.value,
}))

const progressValueStyle = computed(() => ({
  color: textColor.value,
  fontVariantNumeric: 'tabular-nums' as const,
}))

const progressTrackStyle = computed(() => ({
  background: hexToRgba(accentColor.value, 0.12),
}))

const progressFillStyle = computed(() => ({
  width: `${achievementFillPct.value}%`,
  background: progressColor.value,
}))

// ============ hex 转 rgba（用于淡色背景） ============
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return `rgba(84,112,198,${alpha})`
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ============ Sparkline Canvas 绘制 ============
const sparkCanvasRef = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function drawSpark() {
  const canvas = sparkCanvasRef.value
  if (!canvas) return
  const data = sparkData.value
  if (data.length < 2) return

  // 设备像素比，保证清晰度
  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.clientWidth || 80
  const cssH = canvas.clientHeight || 30
  canvas.width = Math.max(1, Math.floor(cssW * dpr))
  canvas.height = Math.max(1, Math.floor(cssH * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padX = 2
  const padY = 4
  const w = cssW - padX * 2
  const h = cssH - padY * 2

  // 折线路径
  ctx.beginPath()
  data.forEach((v, i) => {
    const x = padX + (data.length === 1 ? 0 : (i / (data.length - 1)) * w)
    const y = padY + h - ((v - min) / range) * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = accentColor.value
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()

  // 渐变填充区域
  ctx.lineTo(padX + w, padY + h)
  ctx.lineTo(padX, padY + h)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, padY, 0, padY + h)
  grad.addColorStop(0, hexToRgba(accentColor.value, 0.3))
  grad.addColorStop(1, hexToRgba(accentColor.value, 0))
  ctx.fillStyle = grad
  ctx.fill()

  // 末点小圆点
  const lastX = padX + w
  const lastY = padY + h - ((data[data.length - 1] - min) / range) * h
  ctx.beginPath()
  ctx.arc(lastX, lastY, 2, 0, Math.PI * 2)
  ctx.fillStyle = accentColor.value
  ctx.fill()
}

onMounted(() => {
  nextTick(drawSpark)
  if (sparkCanvasRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => drawSpark())
    resizeObserver.observe(sparkCanvasRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch([sparkData, accentColor, showSpark], () => {
  nextTick(drawSpark)
})
</script>

<style scoped lang="less">
.widget-kpi-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  box-sizing: border-box;
  overflow: hidden;
  user-select: none;

  &__title {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__main-row {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    min-height: 0;
  }

  &__value-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__value-line {
    display: flex;
    align-items: baseline;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }

  &__trend-arrow {
    font-weight: bold;
  }

  &__trend-label {
    opacity: 0.7;
  }

  &__spark {
    flex-shrink: 0;
    width: 80px;
    height: 30px;
    display: block;
  }

  &__progress-wrap {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__progress-info {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 12px;
  }

  &__progress-track {
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }
}
</style>

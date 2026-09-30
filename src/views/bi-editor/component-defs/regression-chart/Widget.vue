<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { ScatterChart, LineChart } from 'echarts/charts'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册散点图 + 折线图（运行一次,echarts/core 内部去重）
use([ScatterChart, LineChart])

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/** 字段映射:把数据集行数据映射成散点 [[x,y], ...] */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { xField, yField } = (props.comp.dataConfig ?? {}) as {
    xField?: string
    yField?: string
  }
  if (!xField || !yField) return null
  return rows.value.map((r) => [Number(r[xField] ?? 0), Number(r[yField] ?? 0)])
})

function debouncedSetOption(builder: () => ECOption) {
  pendingBuilder = builder
  if (debounceTimer !== null) return
  debounceTimer = window.requestAnimationFrame(() => {
    debounceTimer = null
    if (pendingBuilder) {
      baseChartRef.value?.setOption(pendingBuilder())
      pendingBuilder = null
    }
  })
}

/** 🔑 最小二乘法线性回归:返回 { slope, intercept } */
function linearRegression(points: number[][]): { slope: number; intercept: number } {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0 }
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  for (const [x, y] of points) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: +(sumY / n).toFixed(4) }
  const slope = +((n * sumXY - sumX * sumY) / denom).toFixed(4)
  const intercept = +((sumY - slope * sumX) / n).toFixed(4)
  return { slope, intercept }
}

/** 🔑 计算标准误差 σ,用于置信区间带 */
function calcStdError(points: number[][], slope: number, intercept: number): number {
  if (points.length < 3) return 0
  let sumResidualSq = 0
  for (const [x, y] of points) {
    const predicted = slope * x + intercept
    sumResidualSq += (y - predicted) ** 2
  }
  return +Math.sqrt(sumResidualSq / (points.length - 2)).toFixed(4)
}

/** 置信度 → Z 值 */
function confidenceZ(level: string): number {
  if (level === '90') return 1.645
  if (level === '99') return 2.576
  return 1.96 // 95%
}

/**
 * 🔑 回归分析图"组件特有"option —— 散点 + 回归线 + 置信区间带。
 *   title / legend / xAxis / yAxis / tooltip / color / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const scatterData = mappedData.value
    ?? (Array.isArray(mergedProps.scatterData) ? mergedProps.scatterData : [])
  // 🔑 用户可在 props.regressionLine 中预设回归方程,否则从散点动态计算
  const userLine = mergedProps.regressionLine
  const regression =
    userLine && typeof userLine.slope === 'number' && typeof userLine.intercept === 'number'
      ? { slope: Number(userLine.slope), intercept: Number(userLine.intercept) }
      : linearRegression(scatterData)

  const showRegression = mergedProps.showRegression !== false
  const showConfidence = mergedProps.showConfidence !== false
  const confidenceLevel = String(mergedProps.confidenceLevel || '95')
  const scatterColor = String(mergedProps.scatterColor)
  const lineColor = String(mergedProps.lineColor)
  const confidenceColor = String(mergedProps.confidenceColor)
  const symbolSize = Number(mergedProps.symbolSize || 8)

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  // 🔑 散点的 X 范围,用于绘制回归线 + 置信区间带
  let minX = Infinity
  let maxX = -Infinity
  for (const [x] of scatterData) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
  }
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
    minX = 0
    maxX = 10
  }

  const seriesList: any[] = []

  // 🔑 置信区间带（先画,叠在底层）
  if (showConfidence && scatterData.length >= 3) {
    const sigma = calcStdError(scatterData, regression.slope, regression.intercept)
    const z = confidenceZ(confidenceLevel)
    const margin = +(z * sigma).toFixed(4)
    // 上下界曲线点:从 minX 到 maxX 等距取 20 个点
    const steps = 20
    const upper: (number | null)[] = []
    const lower: (number | null)[] = []
    const base: number[] = []
    for (let i = 0; i <= steps; i++) {
      const x = minX + ((maxX - minX) * i) / steps
      const y = regression.slope * x + regression.intercept
      base.push(x)
      upper.push(+(y + margin).toFixed(4))
      lower.push(+(y - margin).toFixed(4))
    }
    // 上界 + 下界反向,形成闭合区域
    const bandData = base.map((x, i) => [x, upper[i]])
    for (let i = base.length - 1; i >= 0; i--) {
      bandData.push([base[i], lower[i]])
    }
    seriesList.push({
      name: '置信区间',
      type: 'line',
      data: bandData,
      smooth: false,
      symbol: 'none',
      lineStyle: { opacity: 0 },
      areaStyle: { color: confidenceColor },
      color: confidenceColor,
      z: 1,
      stack: 'confidence-band',
      label: { show: false },
    })
  }

  // 🔑 回归线
  if (showRegression) {
    seriesList.push({
      name: '回归线',
      type: 'line',
      data: [
        [minX, +(regression.slope * minX + regression.intercept).toFixed(4)],
        [maxX, +(regression.slope * maxX + regression.intercept).toFixed(4)],
      ],
      smooth: false,
      symbol: 'none',
      lineStyle: { width: 2, color: lineColor },
      itemStyle: { color: lineColor },
      color: lineColor,
      z: 5,
      label: {
        show: false,
        position: seriesLabelPosition as any,
        fontFamily: seriesLabelFontFamily,
        fontSize: seriesLabelFontSize,
        fontWeight: seriesLabelFontWeight,
        fontStyle: seriesLabelFontStyle,
        color: seriesLabelColor,
      },
    })
  }

  // 🔑 散点（最上层）
  seriesList.push({
    name: '散点',
    type: 'scatter',
    data: scatterData,
    symbolSize,
    itemStyle: { color: scatterColor },
    color: scatterColor,
    z: 10,
    label: {
      show: false,
      position: seriesLabelPosition as any,
      formatter: (params: any) => `(${params.value[0]}, ${params.value[1]})`,
      fontFamily: seriesLabelFontFamily,
      fontSize: seriesLabelFontSize,
      fontWeight: seriesLabelFontWeight,
      fontStyle: seriesLabelFontStyle,
      color: seriesLabelColor,
    },
    emphasis: {
      focus: 'self',
      itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
    },
  })

  const specificOption: ECOption = {
    xAxis: { scale: true, type: 'value' },
    yAxis: { scale: true, type: 'value' },
    series: seriesList as any,
  }
  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: true,
      fallbackTitle: '回归分析图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  // 🔑 性能优化：签名式 watch 替代 deep watch
  [
    () => JSON.stringify(props.comp.props),
    () => JSON.stringify(props.comp.dataConfig),
    rows,
  ],
  () => {
    applyChartOption()
  },
)

// 清理定时器, 防止内存泄漏
onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
  pendingBuilder = null
})
</script>

<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册折线图（运行一次,echarts/core 内部去重）
use([LineChart])

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/** 字段映射:把数据集行数据映射成置信区间图所需的 {categories, series} */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { categoryField, valueFields } = (props.comp.dataConfig ?? {}) as {
    categoryField?: string
    valueFields?: string[]
  }
  if (!categoryField || !valueFields?.length) return null
  return {
    categories: rows.value.map((r) => String(r[categoryField] ?? '')),
    series: valueFields.map((f) => ({
      name: f,
      data: rows.value.map((r) => Number(r[f] ?? 0)),
    })),
  }
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

/** 把 rgba/hex 颜色按 alpha 重新合成 */
function applyAlpha(color: string, alphaPct: number): string {
  const a = +(alphaPct / 100).toFixed(2)
  // rgba(...) 形式
  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/)
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',').map((s) => s.trim())
    const r = parts[0] ?? 84
    const g = parts[1] ?? 112
    const b = parts[2] ?? 198
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  // hex 形式
  const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return color
}

/**
 * 🔑 置信区间图"组件特有"option —— 实际值/预测值 折线 + 上下界组合成区间带。
 *   title / legend / xAxis / yAxis / tooltip / color / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const categories = mappedData.value?.categories
    ?? (Array.isArray(mergedProps.categories) ? mergedProps.categories : [])
  const seriesData = mappedData.value?.series
    ?? (Array.isArray(mergedProps.series) ? mergedProps.series : [])

  const bandColor = String(mergedProps.bandColor)
  const actualColor = String(mergedProps.actualColor)
  const forecastColor = String(mergedProps.forecastColor)
  const bandOpacity = Number(mergedProps.bandOpacity || 30)
  const showActual = mergedProps.showActual !== false
  const showForecast = mergedProps.showForecast !== false
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  // 🔑 取 seriesData 中的 4 条线:实际值 / 预测值 / 上界 / 下界（按 name 匹配）
  const findSeries = (name: string) =>
    seriesData.find(
      (s: { name: string }) => String(s.name || '').trim() === name,
    ) as { name: string; data: number[] } | undefined

  const actualSeries = findSeries('实际值')
  const forecastSeries = findSeries('预测值')
  const upperSeries = findSeries('上界')
  const lowerSeries = findSeries('下界')

  const bandFill = applyAlpha(bandColor, bandOpacity)

  const makeLabel = (show: boolean) => ({
    show,
    position: seriesLabelPosition as any,
    fontFamily: seriesLabelFontFamily,
    fontSize: seriesLabelFontSize,
    fontWeight: seriesLabelFontWeight,
    fontStyle: seriesLabelFontStyle,
    color: seriesLabelColor,
  })

  const seriesList: any[] = []

  // 🔑 区间带：用上界 - stack + areaStyle 形成填充,下界反向 + stack 闭合
  //   实现思路:下界作为基准 stack('band'),上界用 stack('band') + (上界-下界) 的差值,areaStyle 填充
  if (upperSeries && lowerSeries) {
    // 差值数据（上界-下界）,作为 band 填充的高度
    const diffData = upperSeries.data.map((u: number, i: number) => {
      const l = lowerSeries.data[i]
      if (u == null || l == null) return null
      return +(u - l).toFixed(4)
    })
    // 下界（基准,带 stack,展示底线）
    seriesList.push({
      name: '下界',
      type: 'line',
      data: lowerSeries.data,
      lineStyle: { opacity: 0 },
      symbol: 'none',
      stack: 'confidence-band',
      silent: true,
      color: bandFill,
      z: 1,
      label: makeLabel(false),
    })
    // 差值（叠在下界上,areaStyle 形成填充带）
    seriesList.push({
      name: '区间带',
      type: 'line',
      data: diffData,
      lineStyle: { opacity: 0 },
      symbol: 'none',
      stack: 'confidence-band',
      areaStyle: { color: bandFill },
      color: bandFill,
      z: 2,
      label: makeLabel(false),
    })
  }

  // 🔑 实际值
  if (showActual && actualSeries) {
    const style = seriesStyles.find(
      (x: { seriesName: string; color: string; labelShow: boolean }) =>
        String(x.seriesName || '').trim() === '实际值',
    )
    const color = style?.color || actualColor
    seriesList.push({
      name: '实际值',
      type: 'line',
      data: actualSeries.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color },
      itemStyle: { color },
      color,
      z: 10,
      label: makeLabel(!!style?.labelShow),
    })
  }

  // 🔑 预测值
  if (showForecast && forecastSeries) {
    const style = seriesStyles.find(
      (x: { seriesName: string; color: string; labelShow: boolean }) =>
        String(x.seriesName || '').trim() === '预测值',
    )
    const color = style?.color || forecastColor
    seriesList.push({
      name: '预测值',
      type: 'line',
      data: forecastSeries.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color, type: 'dashed' },
      itemStyle: { color },
      color,
      z: 10,
      label: makeLabel(!!style?.labelShow),
    })
  }

  const specificOption: ECOption = {
    xAxis: { data: categories },
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
      xAxisData: specificOption.xAxis ? (specificOption.xAxis as any).data : undefined,
      fallbackTitle: '置信区间图',
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

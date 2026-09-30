<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册柱状图 + 折线图（运行一次,echarts/core 内部去重）
use([BarChart, LineChart])

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/** 字段映射:把数据集行数据映射成 MACD 所需的 {categories, dif, dea, macd} */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { categoryField, difField, deaField, macdField } = (props.comp.dataConfig ?? {}) as {
    categoryField?: string
    difField?: string
    deaField?: string
    macdField?: string
  }
  if (!categoryField || !difField || !deaField || !macdField) return null
  return {
    categories: rows.value.map((r) => String(r[categoryField] ?? '')),
    dif: rows.value.map((r) => Number(r[difField] ?? 0)),
    dea: rows.value.map((r) => Number(r[deaField] ?? 0)),
    macd: rows.value.map((r) => Number(r[macdField] ?? 0)),
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

/**
 * 🔑 MACD 指标图"组件特有"option —— DIF/DEA 折线 + MACD 红绿柱。
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
  const difData = mappedData.value?.dif
    ?? (Array.isArray(mergedProps.dif) ? mergedProps.dif : [])
  const deaData = mappedData.value?.dea
    ?? (Array.isArray(mergedProps.dea) ? mergedProps.dea : [])
  const macdData = mappedData.value?.macd
    ?? (Array.isArray(mergedProps.macd) ? mergedProps.macd : [])

  const showDIF = mergedProps.showDIF !== false
  const showDEA = mergedProps.showDEA !== false
  const showMACD = mergedProps.showMACD !== false
  const difColor = String(mergedProps.difColor)
  const deaColor = String(mergedProps.deaColor)
  const macdUpColor = String(mergedProps.macdUpColor)
  const macdDownColor = String(mergedProps.macdDownColor)

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  const seriesList: any[] = []

  // 🔑 MACD 柱（按正负着色）—— 放第一个,叠加在 DIF/DEA 线下方
  if (showMACD) {
    const coloredMacd = macdData.map((v: number) => ({
      value: v,
      itemStyle: { color: v >= 0 ? macdUpColor : macdDownColor },
    }))
    seriesList.push({
      name: 'MACD',
      type: 'bar',
      data: coloredMacd,
      barWidth: 8,
      // 系列级别颜色（图例展示用）
      color: macdUpColor,
      label: {
        show: false,
        position: seriesLabelPosition as any,
        fontFamily: seriesLabelFontFamily,
        fontSize: seriesLabelFontSize,
        fontWeight: seriesLabelFontWeight,
        fontStyle: seriesLabelFontStyle,
        color: seriesLabelColor,
      },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
      },
    })
  }

  if (showDIF) {
    seriesList.push({
      name: 'DIF',
      type: 'line',
      data: difData,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color: difColor },
      itemStyle: { color: difColor },
      color: difColor,
      z: 10,
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

  if (showDEA) {
    seriesList.push({
      name: 'DEA',
      type: 'line',
      data: deaData,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color: deaColor },
      itemStyle: { color: deaColor },
      color: deaColor,
      z: 10,
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
      fallbackTitle: 'MACD指标图',
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

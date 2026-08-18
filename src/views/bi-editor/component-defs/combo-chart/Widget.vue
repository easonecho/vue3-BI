<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultProps, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingOption: ECOption | null = null

const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/**
 * 🔑 字段映射:双轴组合图需要 (categories, barSeries, lineSeries)
 *   dataConfig = { categoryField, barField, lineField }
 */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { categoryField, barField, lineField } = (props.comp.dataConfig ?? {}) as {
    categoryField?: string
    barField?: string
    lineField?: string
  }
  if (!categoryField || !barField || !lineField) return null
  return {
    categories: rows.value.map((r) => String(r[categoryField] ?? '')),
    barSeries: {
      name: barField,
      data: rows.value.map((r) => Number(r[barField] ?? 0)),
    },
    lineSeries: {
      name: lineField,
      data: rows.value.map((r) => Number(r[lineField] ?? 0)),
    },
  }
})

function debouncedSetOption(option: ECOption) {
  pendingOption = option
  if (debounceTimer !== null) return
  debounceTimer = window.requestAnimationFrame(() => {
    debounceTimer = null
    if (pendingOption) {
      baseChartRef.value?.setOption(pendingOption)
      pendingOption = null
    }
  })
}

/**
 * 🔑 双轴组合图"组件特有"option —— 柱状(左轴) + 折线(右轴)。
 *   hasAxes=true，但 yAxis 是双轴数组，需要在 specificOption 中覆盖。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = def ? deriveDefaultProps(def.propsSchema, def.extraDefaults) : {}
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const categories = mappedData.value?.categories
    ?? (Array.isArray(mergedProps.categories)
      ? mergedProps.categories
      : ['1月', '2月', '3月', '4月', '5月', '6月', '7月'])
  const barSeries = mappedData.value?.barSeries
    ?? (mergedProps.barSeries
      ? { name: mergedProps.barSeries.name, data: mergedProps.barSeries.data }
      : { name: '销售额', data: [120, 200, 150, 80, 70, 110, 130] })
  const lineSeries = mappedData.value?.lineSeries
    ?? (mergedProps.lineSeries
      ? { name: mergedProps.lineSeries.name, data: mergedProps.lineSeries.data }
      : { name: '增长率(%)', data: [10, 15, 8, 12, 18, 22, 25] })

  const barWidth = Number(mergedProps.barWidth)
  const smooth = !!mergedProps.smooth
  const rightAxisPercent = !!mergedProps.rightAxisPercent
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  // 查找系列样式
  const findStyle = (name: string) => seriesStyles.find(
    (x: { seriesName: string; color: string; lineWidth: number; chartType: string; labelShow: boolean }) =>
      String(x.seriesName || '').trim() === String(name || '').trim(),
  )
  const barStyle = findStyle(barSeries.name)
  const lineStyle = findStyle(lineSeries.name)

  const barColor = barStyle?.color || ECHARTS_DEFAULT_PALETTE[0]
  const lineColor = lineStyle?.color || ECHARTS_DEFAULT_PALETTE[1]
  const lineWidth = typeof lineStyle?.lineWidth === 'number' ? lineStyle.lineWidth : 2

  const specificOption: ECOption = {
    xAxis: {
      data: categories,
    },
    // 🔑 双轴:左轴显示柱状数值，右轴显示折线百分比
    yAxis: [
      {
        type: 'value',
        name: barSeries.name,
        position: 'left',
      },
      {
        type: 'value',
        name: lineSeries.name,
        position: 'right',
        axisLabel: {
          formatter: rightAxisPercent ? '{value}%' : '{value}',
        },
      },
    ],
    series: [
      {
        name: barSeries.name,
        type: 'bar',
        barWidth,
        data: barSeries.data,
        itemStyle: { color: barColor },
        label: {
          show: !!barStyle?.labelShow,
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
          position: seriesLabelPosition as any,
        },
      },
      {
        name: lineSeries.name,
        type: 'line',
        yAxisIndex: 1,
        smooth,
        data: lineSeries.data,
        lineStyle: { color: lineColor, width: lineWidth },
        itemStyle: { color: lineColor },
        symbol: 'circle',
        symbolSize: 6,
        label: {
          show: !!lineStyle?.labelShow,
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
          position: seriesLabelPosition as any,
        },
      },
    ],
  }
  return { specificOption, mergedProps }
}

function applyChartOption() {
  const baseOption = getBaseOption()
  const { specificOption, mergedProps } = getChartSpecificOption()
  const merged = applyUserChartConfig(baseOption, mergedProps, specificOption, {
    hasAxes: true,
    xAxisData: specificOption.xAxis ? (specificOption.xAxis as any).data : undefined,
    fallbackTitle: '双轴组合图',
  })
  debouncedSetOption(merged)
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  [() => props.comp.props, rows, () => props.comp.dataConfig],
  () => {
    applyChartOption()
  },
  { deep: true },
)

// 清理定时器, 防止内存泄漏
onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
})

</script>

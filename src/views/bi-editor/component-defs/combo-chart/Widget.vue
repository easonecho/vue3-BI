<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig, getXAxisData } from '../_shared/echarts-options'
import { str, strArray, optionalStr, fontWeightOf, fontStyleOf, labelPositionOf } from '../_shared/props'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import { useChartAggregation } from '../../composables/useChartAggregation'
import { useLinkageStore } from '@/stores/linkage'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
const linkageStore = useLinkageStore()
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

const dataSourceRef = computed(() => props.comp.dataSource)

/** 🔑 类目字段 (钻取时切换为 drillFields[N-1]) */
const categoryField = computed(() =>
  linkageStore.getDrillField(
    props.comp.id,
    strArray(props.comp.dataConfig.drillFields),
    str(props.comp.dataConfig.categoryField),
  ),
)
const barField = computed(() => optionalStr(props.comp.dataConfig.barField))
const lineField = computed(() => optionalStr(props.comp.dataConfig.lineField))

/** 🔑 聚合下推:按类目在服务端 GROUP BY 两个度量;未启用聚合时为 null → 原始行 */
const aggregateRequest = useChartAggregation(props.comp, {
  groupBy: () => categoryField.value,
  metrics: () => [barField.value, lineField.value].filter((f): f is string => !!f),
  orderBy: () => (categoryField.value ? { field: categoryField.value, direction: 'asc' } : undefined),
})
const { rows } = useDatasetBinding(dataSourceRef, true, aggregateRequest)

/**
 * 🔑 字段映射:双轴组合图需要 (categories, barSeries, lineSeries)
 *   dataConfig = { categoryField, barField, lineField }
 */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  if (!categoryField.value || !barField.value || !lineField.value) return null
  return {
    categories: rows.value.map((r) => String(r[categoryField.value] ?? '')),
    barSeries: {
      name: barField.value,
      data: rows.value.map((r) => Number(r[barField.value!] ?? 0)),
    },
    lineSeries: {
      name: lineField.value,
      data: rows.value.map((r) => Number(r[lineField.value!] ?? 0)),
    },
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
 * 🔑 双轴组合图"组件特有"option —— 柱状(左轴) + 折线(右轴)。
 *   hasAxes=true，但 yAxis 是双轴数组，需要在 specificOption 中覆盖。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
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
  const seriesLabelFontWeight = fontWeightOf(mergedProps.seriesLabelFontWeight)
  const seriesLabelFontStyle = fontStyleOf(mergedProps.seriesLabelFontStyle)
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
          position: labelPositionOf(seriesLabelPosition),
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
          position: labelPositionOf(seriesLabelPosition),
        },
      },
    ],
  }
  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: true,
      xAxisData: getXAxisData(specificOption),
      fallbackTitle: '双轴组合图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  // 🔑 性能优化：签名式 watch 替代 deep watch。
  //   原 deep:true 遍历 comp.props + comp.dataConfig + rows 全部元素（rows 可能 1000+ 行）。
  //   改为 JSON.stringify 签名对比小对象 + rows 浅 ref watch（仅引用变更触发）。
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

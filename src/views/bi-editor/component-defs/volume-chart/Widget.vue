<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册柱状图（运行一次,echarts/core 内部去重）
use([BarChart])

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/** 字段映射:把数据集行数据映射成成交量图所需的 {categories, series} */
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

/** 计算 MA 均线（简单移动平均） */
function calcMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) sum += data[j]
      result.push(+(sum / period).toFixed(2))
    }
  }
  return result
}

/**
 * 🔑 成交量图"组件特有"option —— 只写 series（bar + MA line）+ 涨跌颜色。
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
  const barWidth = Number(mergedProps.barWidth)
  const upColor = String(mergedProps.upColor)
  const downColor = String(mergedProps.downColor)
  const showMA = !!mergedProps.showMA
  const maPeriod = Number(mergedProps.maPeriod || 5)
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  const seriesList: any[] = []

  seriesData.forEach((s: { name: string; data: number[] }, idx: number) => {
    // 🔑 按 series name 匹配 seriesStyles 中配置的单独样式
    const style = seriesStyles.find(
      (x: { seriesName: string; color: string; labelShow: boolean }) =>
        String(x.seriesName || '').trim() === String(s.name || '').trim(),
    )
    const showLabel = !!style?.labelShow

    // 🔑 涨跌颜色:与前一日对比,涨用 upColor,跌用 downColor,首日默认 upColor
    const coloredData = s.data.map((val: number, i: number) => {
      if (i === 0) return { value: val, itemStyle: { color: upColor } }
      const prev = s.data[i - 1]
      const color = val >= prev ? upColor : downColor
      return { value: val, itemStyle: { color } }
    })

    seriesList.push({
      name: s.name,
      type: 'bar',
      data: coloredData,
      barWidth,
      barMaxWidth: 30,
      // 🔑 系列级别颜色（仅图例展示用,实际柱体颜色由 itemStyle.color 决定）
      color:
        style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length],
      label: {
        show: showLabel,
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

    // 🔑 MA 均线:仅对第一个 series 叠加 MA 线
    if (showMA && idx === 0) {
      const maData = calcMA(s.data, maPeriod)
      seriesList.push({
        name: `MA${maPeriod}`,
        type: 'line',
        data: maData,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#fac858' },
        z: 10,
      })
    }
  })

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
      fallbackTitle: '成交量图',
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

<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { ThemeRiverChart } from 'echarts/charts'
import { SingleAxisComponent } from 'echarts/components'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册主题河流图 + 单坐标轴组件（运行一次,echarts/core 内部去重）
use([ThemeRiverChart, SingleAxisComponent])

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

/** 防抖定时器 */
let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/**
 * 🔑 字段映射:把数据集行数据映射成主题河流图所需的 {singleAxisDim, data}。
 *   dataConfig = { dateField, valueField, nameField }
 *   每行 -> [date, value, name] 三元组;singleAxisDim 为去重后的日期列表。
 */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { dateField, valueField, nameField } = (props.comp.dataConfig ?? {}) as {
    dateField?: string
    valueField?: string
    nameField?: string
  }
  if (!dateField || !valueField || !nameField) return null

  const singleAxisDim: string[] = []
  const data: Array<[string, number, string]> = []
  rows.value.forEach((r) => {
    const d = String(r[dateField] ?? '')
    if (!singleAxisDim.includes(d)) singleAxisDim.push(d)
    data.push([d, Number(r[valueField] ?? 0), String(r[nameField] ?? '')])
  })
  return { singleAxisDim, data }
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
 * 🔑 主题河流图"组件特有"option —— 写 singleAxis + 1 个 themeRiver series。
 *   主题河流图无传统 X/Y 坐标轴,hasAxes=false;title / legend / tooltip / animation 由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const singleAxisDim = mappedData.value?.singleAxisDim
    ?? (Array.isArray(mergedProps.singleAxisDim) ? mergedProps.singleAxisDim : [])
  const data = mappedData.value?.data
    ?? (Array.isArray(mergedProps.data) ? mergedProps.data : [])
  const boundaryGap = !!mergedProps.boundaryGap
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  // 🔑 收集所有出现的主题名,用于按 index 匹配色板兜底
  const themeNames: string[] = []
  data.forEach((item: [string, number, string]) => {
    const n = item[2]
    if (!themeNames.includes(n)) themeNames.push(n)
  })

  // 🔑 按 name 匹配构建每个主题的颜色映射
  const colorByName = (name: string): string => {
    const style = seriesStyles.find(
      (x: { name: string; color: string }) =>
        String(x.name || '').trim() === String(name || '').trim(),
    )
    if (style?.color) return style.color
    const idx = themeNames.indexOf(name)
    return ECHARTS_DEFAULT_PALETTE[(idx < 0 ? 0 : idx) % ECHARTS_DEFAULT_PALETTE.length]
  }

  // 🔑 系列标签样式
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  // 🔑 把三元组数据附加 itemStyle.color,实现主题级配色
  const coloredData = data.map((item: [string, number, string]) => ({
    value: item,
    itemStyle: { color: colorByName(item[2]) },
  }))

  const specificOption: ECOption = {
    singleAxis: {
      type: 'category',
      data: singleAxisDim,
      boundaryGap,
      axisLabel: {
        fontFamily: String(mergedProps.xAxisLabelFontFamily),
        color: String(mergedProps.xAxisLabelColor),
        fontSize: Number(mergedProps.xAxisLabelFontSize),
        fontWeight: mergedProps.xAxisLabelFontWeight as any,
        fontStyle: mergedProps.xAxisLabelFontStyle as any,
      },
    },
    series: [
      {
        type: 'themeRiver',
        data: coloredData,
        label: {
          show: true,
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
      } as any,
    ],
  } as any
  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: false,
      fallbackTitle: '主题河流图',
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

<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { BoxplotChart } from 'echarts/charts'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册箱线图（运行一次,echarts/core 内部去重）
use([BoxplotChart])

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
 * 🔑 字段映射:把数据集行数据映射成箱线图所需的 {categories, series}。
 *   valueFields 期望按顺序为 [min, Q1, median, Q3, max] 5 个字段（每行 -> 一个箱体）。
 */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { categoryField, valueFields } = (props.comp.dataConfig ?? {}) as {
    categoryField?: string
    valueFields?: string[]
  }
  if (!categoryField || !valueFields || valueFields.length < 5) return null
  return {
    categories: rows.value.map((r) => String(r[categoryField] ?? '')),
    series: [
      {
        name: '分布',
        data: rows.value.map((r) => valueFields.map((f) => Number(r[f] ?? 0))),
      },
    ],
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
 * 🔑 箱线图"组件特有"option —— 只写 series(boxplot) + 箱体宽度。
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
  const boxWidth = Number(mergedProps.boxWidth)
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  const specificOption: ECOption = {
    xAxis: {
      data: categories,
    },
    series: seriesData.map((s: { name: string; data: number[][] }, idx: number) => {
      // 🔑 按 series name 匹配 seriesStyles 中配置的单独样式
      const style = seriesStyles.find(
        (x: { seriesName: string; color: string; labelShow: boolean }) =>
          String(x.seriesName || '').trim() === String(s.name || '').trim(),
      )
      const showLabel = !!style?.labelShow
      // 🔑 颜色兜底:未配置时按 index 取 ECHARTS 标准调色板
      const seriesColor =
        style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length]

      return {
        name: s.name,
        type: 'boxplot',
        data: s.data,
        boxWidth,
        color: seriesColor,
        itemStyle: {
          color: seriesColor,
        },
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
      }
    }),
  } as any
  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: true,
      xAxisData: specificOption.xAxis ? (specificOption.xAxis as any).data : undefined,
      fallbackTitle: '箱线图',
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

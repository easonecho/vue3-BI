<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/** 字段映射:把数据集行数据映射成面积图所需的 {categories, series} */
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

/**
 * 🔑 面积图"组件特有"option —— 只写 series（smooth/areaStyle/symbolSize）。
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
    ?? (Array.isArray(mergedProps.categories)
      ? mergedProps.categories
      : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'])
  const seriesData = mappedData.value?.series
    ?? (Array.isArray(mergedProps.series)
      ? mergedProps.series
      : [
          { name: '收入', data: [820, 932, 901, 934, 1290, 1330, 1320] },
          { name: '支出', data: [320, 432, 401, 534, 790, 830, 920] },
        ])
  const smooth = !!mergedProps.smooth
  const areaOpacity = Number(mergedProps.areaOpacity)
  const stack = !!mergedProps.stack
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const specificOption: ECOption = {
    xAxis: {
      data: categories,
      boundaryGap: false,
    },
    series: seriesData.map((s: { name: string; data: number[] }, idx: number) => {
      const style = seriesStyles.find(
        (x: {
          seriesName: string
          color: string
          lineWidth: number
          areaStyle: boolean
          labelShow: boolean
        }) => String(x.seriesName || '').trim() === String(s.name || '').trim(),
      )
      const itemColor =
        style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length]
      const lineWidth = typeof style?.lineWidth === 'number' ? style.lineWidth : 2
      const shouldShowArea = style ? !!style.areaStyle : true
      const showLabel = !!style?.labelShow

      const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
      const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
      const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
      const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
      const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
      const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

      return {
        name: s.name,
        type: 'line',
        data: s.data,
        smooth,
        stack: stack ? 'total' : undefined,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: lineWidth, color: itemColor },
        itemStyle: itemColor ? { color: itemColor } : undefined,
        areaStyle: shouldShowArea ? { opacity: areaOpacity, color: itemColor } : undefined,
        label: {
          show: showLabel,
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
          position: seriesLabelPosition as any,
        },
        emphasis: { focus: 'series' },
      }
    }),
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
      fallbackTitle: '面积图',
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

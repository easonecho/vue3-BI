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
import { useDatasetBinding, useWorkerMappedData } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

// 🔑 Worker 数据集映射：大数据集（> 500 行）在 Worker 中计算，主线程零开销
const categoryField = computed(() => (props.comp.dataConfig as any)?.categoryField as string | undefined)
const valueFields = computed(() => (props.comp.dataConfig as any)?.valueFields as string[] | undefined)
const mappedData = useWorkerMappedData(rows, categoryField, valueFields)

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
 * 🔑 折线图"组件特有"option —— 只写 series（smooth/areaStyle/symbolSize）。
 *   title / legend / xAxis / yAxis / tooltip / color / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  // 🔑 合并默认值：schema defaults → actual props（保证特有字段如 smooth/pointSize 有默认值）
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
      : [{ name: '数据', data: [120, 200, 150, 80, 70, 110, 130] }])
  const smooth = !!mergedProps.smooth // schema default: true
  const showArea = !!mergedProps.area
  const pointSize = Number(mergedProps.pointSize)
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const specificOption: ECOption = {
    xAxis: {
      data: categories,
      boundaryGap: false,
    },
    series: seriesData.map((s: { name: string; data: number[] }, idx: number) => {
      // 🔑 按 series name 匹配单独样式
      const style = seriesStyles.find(
        (x: {
          seriesName: string
          color: string
          lineWidth: number
          areaStyle: boolean
          labelShow: boolean
        }) => String(x.seriesName || '').trim() === String(s.name || '').trim(),
      )
      // 🔑 颜色兜底：未配置时按 index 取标准调色板
      const itemColor =
        style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length]
      const lineWidth = typeof style?.lineWidth === 'number' ? style.lineWidth : 2
      const shouldShowArea = style ? !!style.areaStyle : showArea
      const showLabel = !!style?.labelShow

      // 🔑 系列标签样式：独立 5 项配置
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
        symbol: pointSize === 0 ? 'none' : 'circle',
        symbolSize: pointSize,
        lineStyle: { width: lineWidth, color: itemColor },
        itemStyle: itemColor ? { color: itemColor } : undefined,
        areaStyle: shouldShowArea ? { opacity: 0.15, color: itemColor } : undefined,
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
      fallbackTitle: '折线图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  // 🔑 性能优化：签名式 watch 替代 deep watch。
  //   mappedData 加入 watch：Worker 异步返回后 mappedData 变化也触发重新渲染。
  [
    () => JSON.stringify(props.comp.props),
    () => JSON.stringify(props.comp.dataConfig),
    rows,
    mappedData,
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

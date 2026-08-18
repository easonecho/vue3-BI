<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultProps } from '../types'
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
 * 🔑 字段映射:热力图需要 (x, y, value) 三元组数据。
 *   dataConfig = { xField, yField, valueField }
 *   把每行映射成 [xIndex, yIndex, value]，并去重得到 xCategories / yCategories。
 */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { xField, yField, valueField } = (props.comp.dataConfig ?? {}) as {
    xField?: string
    yField?: string
    valueField?: string
  }
  if (!xField || !yField || !valueField) return null

  const xCategories: string[] = []
  const yCategories: string[] = []
  rows.value.forEach((r) => {
    const x = String(r[xField] ?? '')
    const y = String(r[yField] ?? '')
    if (!xCategories.includes(x)) xCategories.push(x)
    if (!yCategories.includes(y)) yCategories.push(y)
  })

  const points: [number, number, number][] = rows.value.map((r) => [
    xCategories.indexOf(String(r[xField] ?? '')),
    yCategories.indexOf(String(r[yField] ?? '')),
    Number(r[valueField] ?? 0),
  ])

  return { xCategories, yCategories, points }
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
 * 🔑 热力图"组件特有"option —— 写 xAxis / yAxis / visualMap / series。
 *   热力图有 X/Y 坐标轴（hasAxes=true），且需要 VisualMap 组件。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = def ? deriveDefaultProps(def.propsSchema, def.extraDefaults) : {}
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const xCategories = mappedData.value?.xCategories
    ?? (Array.isArray(mergedProps.heatmapX) ? mergedProps.heatmapX : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'])
  const yCategories = mappedData.value?.yCategories
    ?? (Array.isArray(mergedProps.heatmapY) ? mergedProps.heatmapY : ['0点', '4点', '8点', '12点', '16点', '20点'])
  const points: [number, number, number][] = mappedData.value?.points
    ?? (Array.isArray(mergedProps.heatmapData) ? mergedProps.heatmapData : [])

  const labelShow = !!mergedProps.labelShow
  const visualMapShow = !!mergedProps.visualMapShow
  const visualMapOrient = String(mergedProps.visualMapOrient) as 'horizontal' | 'vertical'
  const minColor = String(mergedProps.minColor)
  const maxColor = String(mergedProps.maxColor)

  const values = points.map((p) => p[2])
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 100

  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#374151')

  const specificOption: ECOption = {
    tooltip: {
      position: 'top',
    },
    visualMap: {
      show: visualMapShow,
      min,
      max,
      calculable: true,
      orient: visualMapOrient,
      left: 'center',
      bottom: '0%',
      inRange: { color: [minColor, maxColor] },
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      splitArea: { show: true },
    },
    series: [
      {
        name: '热力图',
        type: 'heatmap',
        data: points,
        label: {
          show: labelShow,
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }
  return { specificOption, mergedProps }
}

function applyChartOption() {
  const baseOption = getBaseOption()
  const { specificOption, mergedProps } = getChartSpecificOption()
  // 🔑 热力图的 xAxis/yAxis 由组件特有 option 控制（splitArea 等），不走通用 axes
  const merged = applyUserChartConfig(baseOption, mergedProps, specificOption, {
    hasAxes: true,
    fallbackTitle: '热力图',
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

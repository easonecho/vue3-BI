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

/**
 * 字段映射:把数据集行数据映射成散点图所需的 series。
 * - 无 seriesField:单一系列,data 为 [[x,y], ...]
 * - 有 seriesField:按该字段值分组,每组一个系列
 */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { xField, yField, seriesField } = (props.comp.dataConfig ?? {}) as {
    xField?: string
    yField?: string
    seriesField?: string
  }
  if (!xField || !yField) return null

  if (!seriesField) {
    return [
      {
        name: '数据',
        data: rows.value.map((r) => [Number(r[xField] ?? 0), Number(r[yField] ?? 0)]),
      },
    ]
  }
  // 按 seriesField 分组
  const groups = new Map<string, number[][]>()
  for (const r of rows.value) {
    const key = String(r[seriesField] ?? '')
    const point = [Number(r[xField] ?? 0), Number(r[yField] ?? 0)]
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(point)
  }
  return Array.from(groups.entries()).map(([name, data]) => ({ name, data }))
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
 * 🔑 散点图"组件特有"option —— 只写 series（type:scatter/symbolSize/emphasis）。
 *   基础模块配置（title/legend/xAxis/yAxis/tooltip/color/animation）统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  // 🔑 合并默认值：schema defaults → actual props（保证 symbolSize/showLabel 等特有字段有默认值）
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const seriesData = mappedData.value
    ?? (Array.isArray(mergedProps.series)
      ? mergedProps.series
      : [
          {
            name: '数据',
            data: [
              [10.0, 8.04],
              [8.07, 6.95],
              [13.0, 7.58],
              [9.05, 8.81],
              [11.0, 8.33],
              [14.0, 7.66],
              [13.0, 12.5],
              [10.0, 6.26],
              [14.0, 8.84],
              [12.5, 6.2],
            ],
          },
        ])
  const symbolSize = Number(mergedProps.symbolSize)
  const showLabel = !!mergedProps.showLabel
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const specificOption: ECOption = {
    xAxis: { scale: true, type: 'value' },
    yAxis: { scale: true, type: 'value' },
    series: seriesData.map((s: { name: string; data: number[][] }, idx: number) => {
      const style = seriesStyles.find(
        (x: { seriesName: string; color: string; symbolSize: number; labelShow: boolean }) =>
          String(x.seriesName || '').trim() === String(s.name || '').trim(),
      )
      // 🔑 颜色兜底：未配置时按 index 取标准调色板
      const itemColor =
        style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length]
      const size = typeof style?.symbolSize === 'number' ? style.symbolSize : symbolSize
      const labelOn = style ? !!style.labelShow : showLabel

      // 🔑 系列标签样式：独立 5 项配置
      const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
      const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
      const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
      const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
      const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
      const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

      return {
        name: s.name,
        type: 'scatter',
        data: s.data,
        symbolSize: size,
        itemStyle: { color: itemColor },
        label: {
          show: labelOn,
          position: seriesLabelPosition as any,
          formatter: (params: any) => `(${params.value[0]}, ${params.value[1]})`,
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
        },
        emphasis: {
          focus: 'self',
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
        },
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
      fallbackTitle: '散点图',
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

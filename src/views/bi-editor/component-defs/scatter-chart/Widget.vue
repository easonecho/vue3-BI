<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultProps, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)

/**
 * 🔑 散点图"组件特有"option —— 只写 series（type:scatter/symbolSize/emphasis）。
 *   基础模块配置（title/legend/xAxis/yAxis/tooltip/color/animation）统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: EChartsOption
  mergedProps: Record<string, any>
} {
  // 🔑 合并默认值：schema defaults → actual props（保证 symbolSize/showLabel 等特有字段有默认值）
  const def = getDefinition(props.comp.type)
  const schemaDefaults = def ? deriveDefaultProps(def.propsSchema, def.extraDefaults) : {}
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const seriesData = Array.isArray(mergedProps.series)
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
      ]
  const symbolSize = Number(mergedProps.symbolSize)
  const showLabel = !!mergedProps.showLabel
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const specificOption: EChartsOption = {
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
  const baseOption = getBaseOption()
  const { specificOption, mergedProps } = getChartSpecificOption()
  const merged = applyUserChartConfig(baseOption, mergedProps, specificOption, {
    hasAxes: true,
    fallbackTitle: '散点图',
  })
  baseChartRef.value?.setOption(merged)
}

onMounted(() => {
  setTimeout(applyChartOption, 50)
})

watch(
  () => props.comp.props,
  () => {
    applyChartOption()
  },
  { deep: true },
)
</script>

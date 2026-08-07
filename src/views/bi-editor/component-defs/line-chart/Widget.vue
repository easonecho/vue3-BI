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
 * 🔑 折线图"组件特有"option —— 只写 series（smooth/areaStyle/symbolSize）。
 *   title / legend / xAxis / yAxis / tooltip / color / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: EChartsOption
  mergedProps: Record<string, any>
} {
  // 🔑 合并默认值：schema defaults → actual props（保证特有字段如 smooth/pointSize 有默认值）
  const def = getDefinition(props.comp.type)
  const schemaDefaults = def ? deriveDefaultProps(def.propsSchema, def.extraDefaults) : {}
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const categories = Array.isArray(mergedProps.categories)
    ? mergedProps.categories
    : ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const seriesData = Array.isArray(mergedProps.series)
    ? mergedProps.series
    : [{ name: '数据', data: [120, 200, 150, 80, 70, 110, 130] }]
  const smooth = !!mergedProps.smooth // schema default: true
  const showArea = !!mergedProps.area
  const pointSize = Number(mergedProps.pointSize)
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const specificOption: EChartsOption = {
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
          // 🔑 跟随全局字号/颜色
          color: mergedProps.textColor || '#6b7280',
          fontSize: Number(mergedProps.textFontSize || 12),
          position: 'top',
        },
        emphasis: { focus: 'series' },
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
    xAxisData: specificOption.xAxis ? (specificOption.xAxis as any).data : undefined,
    fallbackTitle: '折线图',
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

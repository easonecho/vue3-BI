<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, mergeOptions } from '../_shared/echarts-options'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)

/** 折线图特有 option */
function getChartSpecificOption(): EChartsOption {
  const title = props.comp.props?.title || '折线图'
  const categories = props.comp.props?.categories || ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const seriesData = props.comp.props?.series || [
    { name: '数据', data: [120, 200, 150, 80, 70, 110, 130] },
  ]

  return {
    title: {
      text: title,
      left: 'center',
      top: 4,
      textStyle: { fontSize: 14, fontWeight: 500, color: '#1f2937' },
      show: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#6b7280', fontSize: 12 },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
    },
    series: seriesData.map((s: { name: string; data: number[] }) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.15 },
      emphasis: {
        focus: 'series',
      },
    })),
  }
}

function applyChartOption() {
  const baseOption = getBaseOption()
  const specificOption = getChartSpecificOption()
  const merged = mergeOptions(baseOption, specificOption)
  baseChartRef.value?.setOption(merged)
}

onMounted(() => {
  setTimeout(applyChartOption, 50)
})

watch(
  () => [props.comp.props?.title, props.comp.props?.categories, JSON.stringify(props.comp.props?.series)],
  () => {
    applyChartOption()
  },
  { deep: true },
)
</script>

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

/** 散点图特有 option */
function getChartSpecificOption(): EChartsOption {
  const title = props.comp.props?.title || '散点图'
  const seriesData =
    props.comp.props?.series || [
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

  return {
    title: {
      text: title,
      left: 'center',
      top: 4,
      textStyle: { fontSize: 14, fontWeight: 500, color: '#1f2937' },
      show: true,
    },
    xAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 12 },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false },
      axisLabel: { color: '#6b7280', fontSize: 12 },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
    },
    series: seriesData.map((s: { name: string; data: number[][] }) => ({
      name: s.name,
      type: 'scatter',
      data: s.data,
      symbolSize: 10,
      emphasis: {
        focus: 'self',
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
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
  () => [props.comp.props?.title, JSON.stringify(props.comp.props?.series)],
  () => {
    applyChartOption()
  },
  { deep: true },
)
</script>

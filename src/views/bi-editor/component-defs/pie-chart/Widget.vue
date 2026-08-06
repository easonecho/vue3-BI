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

/** 饼图特有 option */
function getChartSpecificOption(): EChartsOption {
  const title = props.comp.props?.title || '饼图'
  const pieData =
    props.comp.props?.data?.map((item: { name: string; value: number }) => ({
      name: item.name,
      value: item.value,
    })) || [
    { name: '直接访问', value: 1048 },
    { name: '搜索引擎', value: 735 },
    { name: '邮件营销', value: 580 },
    { name: '联盟广告', value: 484 },
    { name: '视频广告', value: 300 },
  ]

  return {
    title: {
      text: title,
      left: 'center',
      top: 4,
      textStyle: { fontSize: 14, fontWeight: 500, color: '#1f2937' },
      show: true,
    },
    grid: {
      left: 20,
      right: 20,
      top: 50,
      bottom: 30,
      containLabel: true,
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
          color: '#6b7280',
          fontSize: 12,
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10,
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
          label: { fontSize: 14, fontWeight: 'bold' },
        },
        data: pieData,
      },
    ],
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
  () => [props.comp.props?.title, JSON.stringify(props.comp.props?.data)],
  () => {
    applyChartOption()
  },
  { deep: true },
)
</script>

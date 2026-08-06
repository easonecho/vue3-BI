<template>
  <div ref="chartRef" class="base-chart" :style="{ width: '100%', height: '100%' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, type ShallowRef } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const chartRef = ref<HTMLDivElement | null>(null)
const chartInstance: ShallowRef<echarts.ECharts | null> = shallowRef(null)
let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value) return
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  chartInstance.value = echarts.init(chartRef.value)
}

function handleResize() {
  chartInstance.value?.resize()
}

onMounted(() => {
  initChart()

  // 监听容器尺寸变化
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(chartRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance.value?.dispose()
  chartInstance.value = null
})

// 监听组件尺寸变化，自动 resize ECharts
watch(
  () => [props.comp.width, props.comp.height],
  () => {
    handleResize()
  },
)

/** 供子类获取 chart 实例 */
defineExpose({
  getChart: () => chartInstance.value,
  setOption: (option: EChartsOption) => {
    chartInstance.value?.setOption(option, true)
  },
  resize: handleResize,
})
</script>

<style scoped lang="less">
.base-chart {
  width: 100%;
  height: 100%;
}
</style>

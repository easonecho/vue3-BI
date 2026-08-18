<template>
  <div ref="chartRef" class="base-chart" :style="{ width: '100%', height: '100%' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick, type ShallowRef } from 'vue'
import { init, type ECharts, type ECOption } from './echarts-config'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const chartRef = ref<HTMLDivElement | null>(null)
const chartInstance: ShallowRef<ECharts | null> = shallowRef(null)
let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value) return
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  chartInstance.value = init(chartRef.value)
}

function handleResize() {
  chartInstance.value?.resize()
}

onMounted(() => {
  // 🔑 使用 nextTick 确保 DOM 布局完成后再初始化 ECharts，
  //   避免容器宽高为 0 时初始化导致图表不渲染
  nextTick(() => {
    initChart()

    // 监听容器尺寸变化
    if (chartRef.value) {
      resizeObserver = new ResizeObserver(() => handleResize())
      resizeObserver.observe(chartRef.value)
    }
  })
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
  setOption: (option: ECOption) => {
    chartInstance.value?.setOption(option, true)
    // 🔑 setOption 后调用 resize，处理容器从 0 尺寸变为有尺寸的情况
    chartInstance.value?.resize()
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

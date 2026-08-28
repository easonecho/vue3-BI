<template>
  <div ref="chartRef" class="base-chart" :style="{ width: '100%', height: '100%' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef, type ShallowRef } from 'vue'
import { init, type ECharts, type ECOption } from './echarts-config'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const chartRef = ref<HTMLDivElement | null>(null)
const chartInstance: ShallowRef<ECharts | null> = shallowRef(null)
let resizeObserver: ResizeObserver | null = null
/** 🔑 按需初始化：IntersectionObserver 监听可见性，可见时才 init ECharts */
let intersectionObserver: IntersectionObserver | null = null
/** 🔑 防止 IO 回调重复调度 init */
let initScheduled = false
/** 🔑 离屏 dispose 防抖：不可见后延迟 500ms 才 dispose，避免频繁滚动时 init/dispose 抖动 */
let disposeTimer: number | null = null
/** 🔑 容器尺寸就绪重试计数：dispose 后重新 init 时重置 */
let retryCount = 0

/** 🔑 待应用的 option：如果 setOption 在 chart 初始化完成前被调用，先缓存，
 *   等 initChart 完成后立即应用，避免首次渲染丢失导致无入场动画。 */
let pendingOption: ECOption | null = null
/** 🔑 标记是否已完成首次 setOption（用于区分首次 vs 后续，决定是否启用 lazyUpdate） */
let firstOptionApplied = false

function initChart() {
  if (!chartRef.value) return
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  chartInstance.value = init(chartRef.value)
  // 🔑 重新 init 后重置 firstOptionApplied，让首次 setOption 走同步路径触发入场动画
  firstOptionApplied = false
  // 🔑 初始化完成后立即应用待处理的 option，触发首次入场动画
  if (pendingOption) {
    const opt = pendingOption
    pendingOption = null
    chartInstance.value.setOption(opt)
    firstOptionApplied = true
  }
}

/** 🔑 RAF 防抖 resize：拉伸组件时 ResizeObserver 高频触发（每帧 1 次），
 *   每次都同步调 chart.resize() 会触发 ECharts 完整 resize 流程 + 布局抖动。
 *   用 RAF 合并同一帧内的多次回调为一次 resize 调用。 */
let resizeRafId: number | null = null
function handleResize() {
  if (resizeRafId !== null) return
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null
    chartInstance.value?.resize()
  })
}

/** 🔑 容器尺寸就绪后 init ECharts + 绑定 ResizeObserver */
function tryInit() {
  const dom = chartRef.value
  if (!dom) return
  if (dom.offsetWidth === 0 || dom.offsetHeight === 0) {
    if (retryCount++ < 10) {
      requestAnimationFrame(tryInit)
    }
    return
  }
  initChart()
  resizeObserver = new ResizeObserver(() => handleResize())
  resizeObserver.observe(dom)
}

onMounted(() => {
  // 🔑 按需初始化 + 离屏 dispose：IntersectionObserver 双向监听可见性。
  //   可见 → init ECharts（配合 requestIdleCallback 分批，避免首屏同时 init 阻塞）。
  //   不可见 → 延迟 500ms dispose（释放 ECharts 实例 + WebGL context，减少内存占用）。
  //   rootMargin: 200px 缓冲区，防止滚动边缘组件频繁 init/dispose。
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // 🔑 可见：取消 pending dispose，init if needed
          if (disposeTimer !== null) {
            clearTimeout(disposeTimer)
            disposeTimer = null
          }
          if (!chartInstance.value && !initScheduled) {
            initScheduled = true
            const run = () => {
              initScheduled = false
              tryInit()
            }
            if ('requestIdleCallback' in window) {
              ;(window as any).requestIdleCallback(run, { timeout: 300 })
            } else {
              setTimeout(run, 16)
            }
          }
        } else {
          // 🔑 不可见：延迟 dispose（500ms 防抖，避免频繁滚动时 init/dispose 抖动）
          //   dispose 释放 ECharts 实例 + WebGL context，减少内存占用
          if (chartInstance.value && disposeTimer === null) {
            disposeTimer = window.setTimeout(() => {
              disposeTimer = null
              chartInstance.value?.dispose()
              chartInstance.value = null
              resizeObserver?.disconnect()
              resizeObserver = null
              // 重置重试计数，下次 init 时从 0 开始
              retryCount = 0
            }, 500)
          }
        }
      }
    },
    { threshold: 0.01, rootMargin: '200px' },
  )
  if (chartRef.value) intersectionObserver.observe(chartRef.value)
})

onBeforeUnmount(() => {
  if (disposeTimer !== null) {
    clearTimeout(disposeTimer)
    disposeTimer = null
  }
  // 🔑 取消 pending RAF，避免组件卸载后回调访问已 dispose 的实例
  if (resizeRafId !== null) {
    cancelAnimationFrame(resizeRafId)
    resizeRafId = null
  }
  intersectionObserver?.disconnect()
  intersectionObserver = null
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance.value?.dispose()
  chartInstance.value = null
})

// 🔑 性能优化：移除冗余的尺寸 watch。
//   ResizeObserver 已监听容器 DOM 尺寸变化并调用 handleResize()，
//   watch(() => `${width}_${height}`) 会在 comp 尺寸变更时同步再触发一次 handleResize()，
//   导致每次 resize 产生 2 次 chart.resize() 调用。
//   ResizeObserver 在浏览器布局完成后异步触发，是更正确的 resize 时机。

/** 🔑 数组类组件的 replaceMerge 列表（只放真正"会被当成数组、且有从有→无/从多→少切换场景"的组件）。
 *   ❌ 严禁把 grid / title / tooltip / toolbox / brush / visualMap 等单对象类组件
 *        或 dataset 这类不会被用户"从数组变空"的组件列入，否则 replaceMerge 会把
 *        这些字段下本来完整的配置整组销毁，导致图表不渲染、dataZoom 无法挂载、
 *        交互层崩溃等怪异问题。
 *   ✅ 只保留：
 *     - dataZoom：会从 inside+slider（2个元素）切到 []（空数组），关不掉问题的核心
 *     - xAxis / yAxis：双轴图表时是数组，单轴时可能从对象变数组
 *     - series：切换图表类型时数组项会完全重写
 *     - legend：在分页 / 自定义 / 关闭场景下会从数组 → 空对象或单对象，需整体替换
 */
const REPLACE_MERGE_KEYS: string[] = [
  'dataZoom',
  'series',
  'xAxis',
  'yAxis',
  'legend',
]

/** 供子类获取 chart 实例 */
defineExpose({
  getChart: () => chartInstance.value,
  setOption: (option: ECOption) => {
    const inst = chartInstance.value
    if (!inst) {
      // 🔑 chart 未初始化完成时缓存 option，initChart 完成后会自动应用
      pendingOption = option
      return
    }
    // 🔑 首次 setOption：同步执行，触发入场动画（首次无旧实例残留，不需要 replaceMerge）
    //   后续 setOption：启用 lazyUpdate + replaceMerge，
    //   让 ECharts 在下一帧批量处理，并且数组类组件整体替换，避免旧配置残留。
    if (!firstOptionApplied) {
      firstOptionApplied = true
      inst.setOption(option)
    } else {
      inst.setOption(option, {
        lazyUpdate: true,
        replaceMerge: REPLACE_MERGE_KEYS,
      } as any)
    }
    // 容器尺寸为 0 时强制 resize：处理初始化时容器未布局完的情况
    const dom = chartRef.value
    if (dom && (dom.offsetWidth === 0 || dom.offsetHeight === 0)) {
      inst.resize()
    }
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

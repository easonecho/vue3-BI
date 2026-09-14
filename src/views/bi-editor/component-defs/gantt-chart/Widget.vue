<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

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

/** 把时间戳按 day/hour/month 粒度格式化为可读标签 */
function formatTimeLabel(val: number, fmt: string): string {
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  if (fmt === 'hour') {
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  if (fmt === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/**
 * 🔑 甘特图"组件特有"option —— 使用 bar 浮动条（stacked）技术实现甘特：
 *   offset 系列（透明）= 起点时间戳，duration 系列（可见）= 持续时长，
 *   堆叠后 duration 条出现在 [start, end] 区间。
 *   X 轴 value（数值=时间戳）+ axisLabel.formatter 模拟时间轴。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const tasks: Array<{
    name: string
    start: string
    end: string
    progress?: number
  }> = Array.isArray(mergedProps.tasks) ? mergedProps.tasks : []

  const barColor = String(mergedProps.barColor || '#22d3ee')
  const barColor2 = String(mergedProps.barColor2 || '#67e8f9')
  const barHeight = Number(mergedProps.barHeight || 20)
  const showLabel = mergedProps.showLabel !== false
  const labelColor = String(mergedProps.labelColor || '#e2e8f0')
  const timeFormat = String(mergedProps.timeFormat || 'day')

  // 反向，让第一个任务在最上方（ECharts category yAxis 末项在顶部）
  const reversedTasks = [...tasks].reverse()
  const taskNames = reversedTasks.map((t) => t.name)

  // 计算 X 轴时间范围
  let minTs = Infinity
  let maxTs = -Infinity
  for (const t of tasks) {
    const s = new Date(t.start).getTime()
    const e = new Date(t.end).getTime()
    if (!Number.isNaN(s) && s < minTs) minTs = s
    if (!Number.isNaN(e) && e > maxTs) maxTs = e
  }
  if (!Number.isFinite(minTs) || !Number.isFinite(maxTs)) {
    minTs = Date.now()
    maxTs = minTs + 24 * 3600 * 1000
  }
  // 两侧留 5% 边距
  const span = Math.max(maxTs - minTs, 24 * 3600 * 1000)
  const pad = span * 0.05
  minTs -= pad
  maxTs += pad

  const specificOption: ECOption = {
    xAxis: {
      type: 'value',
      min: minTs,
      max: maxTs,
      axisLabel: {
        formatter: (val: number) => formatTimeLabel(val, timeFormat),
      },
    },
    yAxis: {
      type: 'category',
      data: taskNames,
    },
    series: [
      // offset 系列（透明）：提供浮动条的起点偏移
      {
        name: 'offset',
        type: 'bar',
        stack: 'gantt',
        barWidth: barHeight,
        data: reversedTasks.map((t) => new Date(t.start).getTime()),
        itemStyle: { color: 'transparent', borderColor: 'transparent' },
        silent: true,
      },
      // duration 系列（可见）：任务条主体
      {
        name: 'duration',
        type: 'bar',
        stack: 'gantt',
        barWidth: barHeight,
        data: reversedTasks.map((t, i) => ({
          value: new Date(t.end).getTime() - new Date(t.start).getTime(),
          itemStyle: { color: i % 2 === 0 ? barColor : barColor2 },
        })),
        label: {
          show: showLabel,
          formatter: (p: any) => reversedTasks[p.dataIndex]?.name || '',
          color: labelColor,
          position: 'right',
        },
        tooltip: {
          formatter: (p: any) => {
            const task = reversedTasks[p.dataIndex]
            if (!task) return ''
            const progress =
              typeof task.progress === 'number' ? ` (${task.progress}%)` : ''
            return `${task.name}<br/>${task.start} ~ ${task.end}${progress}`
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
        },
      },
    ],
  } as any
  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: true,
      fallbackTitle: '甘特图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  [() => JSON.stringify(props.comp.props)],
  () => {
    applyChartOption()
  },
)

onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
  pendingBuilder = null
})
</script>

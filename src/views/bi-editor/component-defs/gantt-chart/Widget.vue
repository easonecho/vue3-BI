<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)
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

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 兼容时间戳 / ISO 字符串 / "YYYY-MM-DD HH:mm:ss" 三种数据集取值 */
function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null
  const d = typeof v === 'number' ? new Date(v) : new Date(String(v).trim().replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function toTs(v: unknown): number {
  const d = toDate(v)
  return d ? d.getTime() : NaN
}

/** 统一成 "YYYY-MM-DD HH:mm"，供坐标轴与 tooltip 展示 */
function toDisplayTime(v: unknown): string {
  const d = toDate(v)
  if (!d) return String(v ?? '').trim()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
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
 * 数据集绑定：按字段映射构建任务列表。
 * 缺少任务名/开始/结束字段或结果为空时返回 null，沿用静态示例数据。
 */
function buildBoundTasks(): Array<{
  name: string
  start: string
  end: string
  progress?: number
}> | null {
  if (!props.comp.dataSource?.datasetId || rows.value.length === 0) return null
  const cfg = (props.comp.dataConfig ?? {}) as Record<string, unknown>
  const nameField = String(cfg.nameField ?? '')
  const startField = String(cfg.startField ?? '')
  const endField = String(cfg.endField ?? '')
  const progressField = String(cfg.progressField ?? '')
  if (!nameField || !startField || !endField) return null

  const tasks: Array<{ name: string; start: string; end: string; progress?: number }> = []
  for (const row of rows.value) {
    const name = String(row[nameField] ?? '').trim()
    const start = toDisplayTime(row[startField])
    const end = toDisplayTime(row[endField])
    if (!name || !start || !end) continue
    const task: { name: string; start: string; end: string; progress?: number } = {
      name,
      start,
      end,
    }
    if (progressField) {
      const progress = Number(row[progressField])
      if (Number.isFinite(progress)) task.progress = progress
    }
    tasks.push(task)
  }
  return tasks.length > 0 ? tasks : null
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

  const boundTasks = buildBoundTasks()
  const tasks: Array<{
    name: string
    start: string
    end: string
    progress?: number
  }> = boundTasks ?? (Array.isArray(mergedProps.tasks) ? mergedProps.tasks : [])

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
    const s = toTs(t.start)
    const e = toTs(t.end)
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
        data: reversedTasks.map((t) => toTs(t.start)),
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
          value: toTs(t.end) - toTs(t.start),
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
            const progress = typeof task.progress === 'number' ? ` (${task.progress}%)` : ''
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
  } as unknown as ECOption
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

watch([() => JSON.stringify(props.comp.props), () => props.comp.dataConfig, rows], () => {
  applyChartOption()
})

onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
  pendingBuilder = null
})
</script>

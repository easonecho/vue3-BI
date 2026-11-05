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

/**
 * 数据集绑定：把 x / y / size 字段映射为散点三元组。
 * 缺少 x 或 y 字段、或无数值行时返回 null，沿用静态示例数据。
 */
function buildBoundPoints(): { name: string; data: number[][]; sizeMax: number } | null {
  if (!props.comp.dataSource?.datasetId || rows.value.length === 0) return null
  const cfg = (props.comp.dataConfig ?? {}) as Record<string, unknown>
  const xField = String(cfg.xField ?? '')
  const yField = String(cfg.yField ?? '')
  const sizeField = String(cfg.sizeField ?? '')
  if (!xField || !yField) return null

  const points: number[][] = []
  let sizeMax = 0
  for (const row of rows.value) {
    const x = Number(row[xField])
    const y = Number(row[yField])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    const rawSize = sizeField ? Number(row[sizeField]) : 0
    const size = Number.isFinite(rawSize) ? rawSize : 0
    points.push([x, y, size])
    if (size > sizeMax) sizeMax = size
  }
  if (points.length === 0) return null
  return { name: yField, data: points, sizeMax: sizeMax || 1 }
}

/**
 * 🔑 气泡图"组件特有"option —— scatter 系列 + visualMap 按 size 维度映射颜色。
 *   x,y,size 三维度，颜色按 size 第四维度渐变。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const bound = buildBoundPoints()
  const seriesData = Array.isArray(mergedProps.series)
    ? mergedProps.series
    : [
        {
          name: '产品A',
          data: [
            [10, 20, 30],
            [20, 40, 50],
            [30, 30, 40],
            [40, 50, 60],
            [50, 20, 30],
            [15, 35, 45],
            [25, 25, 35],
            [35, 45, 55],
          ],
        },
      ]
  const firstSeries =
    bound ??
    ((seriesData[0] as { name: string; data: number[][]; sizeMax?: number }) || {
      name: '数据',
      data: [],
      sizeMax: 100,
    })
  // 静态示例的三维值按 100 为上限，绑定数据按实际最大值缩放
  const sizeScaleMax = firstSeries.sizeMax ?? 100

  const symbolSizeMin = Number(mergedProps.symbolSizeMin || 8)
  const symbolSizeMax = Number(mergedProps.symbolSizeMax || 50)
  const bubbleColor = String(mergedProps.bubbleColor || '#22d3ee')
  const bubbleColor2 = String(mergedProps.bubbleColor2 || '#a5f3fc')
  const opacity = Number(mergedProps.opacity ?? 0.7)

  const specificOption: ECOption = {
    visualMap: {
      show: false,
      min: 0,
      max: sizeScaleMax,
      dimension: 2,
      inRange: {
        color: [bubbleColor, bubbleColor2],
      },
    },
    series: [
      {
        name: firstSeries.name,
        type: 'scatter',
        data: firstSeries.data,
        symbolSize: (val: any[]) => {
          const s = (val && val[2]) || 0
          return symbolSizeMin + (symbolSizeMax - symbolSizeMin) * Math.min(1, s / sizeScaleMax)
        },
        itemStyle: { color: bubbleColor, opacity },
        emphasis: {
          focus: 'self',
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.2)',
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
      fallbackTitle: '气泡图',
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

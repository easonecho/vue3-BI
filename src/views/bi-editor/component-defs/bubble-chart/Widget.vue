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
    (seriesData[0] as { name: string; data: number[][] }) || {
      name: '数据',
      data: [],
    }

  const symbolSizeMin = Number(mergedProps.symbolSizeMin || 8)
  const symbolSizeMax = Number(mergedProps.symbolSizeMax || 50)
  const bubbleColor = String(mergedProps.bubbleColor || '#22d3ee')
  const bubbleColor2 = String(mergedProps.bubbleColor2 || '#a5f3fc')
  const opacity = Number(mergedProps.opacity ?? 0.7)

  const specificOption: ECOption = {
    visualMap: {
      show: false,
      min: 0,
      max: 100,
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
          return symbolSizeMin + (symbolSizeMax - symbolSizeMin) * Math.min(1, s / 100)
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
  } as any
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

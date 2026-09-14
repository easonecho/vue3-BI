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
 * 🔑 平行坐标图"组件特有"option —— parallel 系列 + parallelAxis + parallel 布局。
 *   无传统 X/Y 坐标轴，hasAxes=false。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const dimensions: Array<{ name: string; max?: number }> = Array.isArray(
    mergedProps.dimensions,
  )
    ? mergedProps.dimensions
    : []
  const data: number[][] = Array.isArray(mergedProps.data) ? mergedProps.data : []

  const lineColor = String(mergedProps.lineColor || '#22d3ee')
  const lineOpacity = Number(mergedProps.lineOpacity ?? 0.5)
  const lineWidth = Number(mergedProps.lineWidth || 1.5)
  const axisColor = String(mergedProps.axisColor || '#475569')
  const labelColor = String(mergedProps.labelColor || '#e2e8f0')

  const parallelAxis = dimensions.map((d, i) => ({
    dim: i,
    max: d.max,
    name: d.name,
    nameLocation: 'end',
    nameGap: 20,
    axisLine: { lineStyle: { color: axisColor } },
    axisLabel: { color: labelColor },
  }))

  const specificOption: ECOption = {
    parallelAxis,
    parallel: {
      axisExpandable: true,
      axisExpandCenter: 2,
      parallelAxisDefault: {
        nameTextStyle: { color: labelColor },
      },
    },
    series: [
      {
        type: 'parallel',
        data,
        lineStyle: {
          color: lineColor,
          opacity: lineOpacity,
          width: lineWidth,
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
      hasAxes: false,
      fallbackTitle: '平行坐标图',
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

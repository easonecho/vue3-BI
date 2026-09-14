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

interface SeriesItem {
  name: string
  data: number[]
}

function getChartSpecificOption(): { specificOption: any; mergedProps: Record<string, any> } {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const categories: string[] = (mergedProps.categories as string[]) || ['Q1', 'Q2', 'Q3', 'Q4']
  const series: SeriesItem[] = (mergedProps.series as SeriesItem[]) || [
    { name: '产品A', data: [320, 280, 360, 400] },
  ]

  // 构建 bar3D 所需的 [xIdx, yIdx, value] 数据矩阵
  const data: Array<[number, number, number]> = []
  let maxValue = 0
  for (let yIdx = 0; yIdx < series.length; yIdx++) {
    const s = series[yIdx]
    for (let xIdx = 0; xIdx < s.data.length; xIdx++) {
      const v = Number(s.data[xIdx]) || 0
      data.push([xIdx, yIdx, v])
      if (v > maxValue) maxValue = v
    }
  }

  const visualOn = mergedProps.visualOn !== false
  const colorLow = String(mergedProps.colorLow || '#67e8f9')
  const colorHigh = String(mergedProps.colorHigh || '#0e7490')
  const barColor = String(mergedProps.barColor || '#22d3ee')

  const autoRotate = mergedProps.autoRotate !== false
  const rotateSpeed = Number(mergedProps.rotateSpeed || 3)
  const viewDistance = Number(mergedProps.viewDistance || 220)
  const elevation = Number(mergedProps.elevation || 20)

  const boxWidth = Number(mergedProps.boxWidth || 120)
  const boxDepth = Number(mergedProps.boxDepth || 80)
  const shading = String(mergedProps.shading || 'lambert') as 'lambert' | 'color' | 'realistic'

  const showLabel = mergedProps.showLabel !== false
  const labelColor = String(mergedProps.labelColor || '#ffffff')

  // visualMap 配置：开启时按 Z 值渐变着色；关闭时映射为单色 barColor（仍需声明避免 merge 残留）
  const visualMap = visualOn
    ? {
        show: true,
        min: 0,
        max: maxValue || 100,
        calculable: true,
        inRange: { color: [colorLow, colorHigh] },
        textStyle: { color: '#e2e8f0' },
      }
    : {
        show: false,
        min: 0,
        max: maxValue || 100,
        inRange: { color: [barColor, barColor] },
      }

  const specificOption: any = {
    tooltip: {
      formatter: (p: any) => {
        const v = p.value
        const xName = categories[v[0]] ?? v[0]
        const yName = series[v[1]]?.name ?? v[1]
        return `${yName} / ${xName}<br/>值: <b>${v[2]}</b>`
      },
    },
    visualMap,
    xAxis3D: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#94a3b8' },
    },
    yAxis3D: {
      type: 'category',
      data: series.map((s) => s.name),
      axisLabel: { color: '#94a3b8' },
    },
    zAxis3D: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
    },
    grid3D: {
      boxWidth,
      boxDepth,
      boxHeight: 80,
      viewControl: {
        autoRotate,
        autoRotateSpeed: rotateSpeed,
        autoRotateAfterStill: 3,
        distance: viewDistance,
        alpha: elevation,
        beta: 40,
        animation: true,
        // 允许鼠标拖拽旋转视角
        rotateSensitivity: 1,
        zoomSensitivity: 1,
      },
      // 光照（lambert / realistic 着色需要）
      light: {
        main: { intensity: 2, shadow: true, alpha: 30 },
        ambient: { intensity: 0.4 },
      },
      environment: 'none',
      // 后处理
      postEffect: {
        enable: shading === 'realistic',
        SSAO: { enable: true, quality: 'medium' },
      },
    },
    series: [
      {
        type: 'bar3D',
        data,
        shading,
        // 关闭渐变时柱子统一色（visualMap 关闭后 itemStyle 起作用）
        itemStyle: visualOn ? undefined : { color: barColor },
        label: {
          show: showLabel,
          color: labelColor,
          fontSize: 11,
          formatter: (p: any) => String(p.value[2]),
        },
        emphasis: {
          label: { show: true, color: '#fbbf24', fontSize: 13 },
          itemStyle: { color: '#fbbf24' },
        },
      },
    ],
  }

  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    // 🔑 hasAxes=false：避免 applyUserChartConfig 生成普通 xAxis/yAxis/dataZoom 干扰 3D 坐标
    // 🔑 specificOption 用 as ECOption 断言：echarts-gl 类型未加入 ECOption 联合
    return applyUserChartConfig(baseOption, mergedProps, specificOption as ECOption, {
      hasAxes: false,
      fallbackTitle: '3D柱状图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch([() => JSON.stringify(props.comp.props)], () => {
  applyChartOption()
})

onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
  pendingBuilder = null
})
</script>

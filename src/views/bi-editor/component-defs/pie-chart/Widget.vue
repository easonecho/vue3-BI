<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultProps, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)

let debounceTimer: number | null = null
let pendingOption: ECOption | null = null

function debouncedSetOption(option: ECOption) {
  pendingOption = option
  if (debounceTimer !== null) return
  debounceTimer = window.requestAnimationFrame(() => {
    debounceTimer = null
    if (pendingOption) {
      baseChartRef.value?.setOption(pendingOption)
      pendingOption = null
    }
  })
}

/**
 * 🔑 饼图"组件特有"option —— 只写 series（radius/center/roseType/label/emphasis）。
 *   pie 无坐标轴，所以 hasAxes=false；title / legend / tooltip / color / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  // 🔑 合并默认值：饼图仅使用 chartCommonSchema（无坐标轴），保证 radius/donut/rose 等特有字段有默认值
  const def = getDefinition(props.comp.type)
  const schemaDefaults = def ? deriveDefaultProps(def.propsSchema, def.extraDefaults) : {}
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const pieData = Array.isArray(mergedProps.pieData)
    ? mergedProps.pieData.map((item: { name: string; value: number }) => ({
        name: item.name,
        value: item.value,
      }))
    : [
        { name: '直接访问', value: 1048 },
        { name: '搜索引擎', value: 735 },
        { name: '邮件营销', value: 580 },
        { name: '联盟广告', value: 484 },
        { name: '视频广告', value: 300 },
      ]

  const outerRadius = Number(mergedProps.radius)
  const isDonut = !!mergedProps.donut
  const isRose = !!mergedProps.rose
  const innerRadius = isDonut ? Number(mergedProps.innerRadius) : 0
  const radiusArr = isDonut || isRose ? [`${innerRadius}%`, `${outerRadius}%`] : `${outerRadius}%`
  const roseType: 'area' | 'radius' | undefined = isRose ? 'area' : undefined
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  // 饼图 label.position 仅支持 outside / inside / insideLeft / insideRight / center，将通用 top/bottom/left/right 转换
  const mapPiePosition = (rawPos: string): 'outside' | 'inside' | 'center' => {
    switch (rawPos) {
      case 'inside':
      case 'insideTop':
      case 'insideBottom':
        return 'inside'
      case 'center':
        return 'center'
      default:
        return 'outside'
    }
  }
  const pieLabelPosition = mapPiePosition(String(mergedProps.seriesLabelPosition || 'outside'))

  const specificOption: ECOption = {
    series: [
      {
        name: '饼图',
        type: 'pie',
        radius: radiusArr as any,
        roseType,
        center: ['50%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: pieLabelPosition,
          formatter: '{b}: {d}%',
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
        },
        labelLine: {
          show: pieLabelPosition === 'outside',
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
        data: pieData.map((item: { name: string; value: number }, idx: number) => {
          // 🔑 按 data.name 匹配 seriesStyles 中配置的单独样式
          const style = seriesStyles.find(
            (x: { name: string; color: string; labelShow: boolean }) =>
              String(x.name || '').trim() === String(item.name || '').trim(),
          )
          const out: any = { ...item }
          // 🔑 颜色兜底：未配置时按 index 取 ECHARTS 标准调色板
          out.itemStyle = {
            color: style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length],
          }
          if (style) {
            out.label = { show: !!style.labelShow }
            out.labelLine = { show: !!style.labelShow }
          }
          return out
        }),
      },
    ],
  }
  return { specificOption, mergedProps }
}

function applyChartOption() {
  const baseOption = getBaseOption()
  const { specificOption, mergedProps } = getChartSpecificOption()
  const merged = applyUserChartConfig(baseOption, mergedProps, specificOption, {
    hasAxes: false,
    fallbackTitle: '饼图',
  })
  debouncedSetOption(merged)
}

onMounted(async () => {
  setTimeout(applyChartOption, 50)
})

watch(
  () => props.comp.props,
  () => {
    applyChartOption()
  },
  { deep: true },
)
</script>

<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/**
 * 🔑 字段映射:雷达图需要"指标数组"和"每个系列的数值数组"。
 *   约定:dataConfig = { nameField, valueFields }
 *   - nameField:用于匹配雷达图指标名称（每行的该列等于指标名时，把该行 valueFields 数值填进对应位置）
 *   - valueFields:每列是一个系列，每列的值按行顺序组成 series.data
 *
 *   若无 datasetId，走 extraDefaults 兜底数据。
 */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { nameField, valueFields } = (props.comp.dataConfig ?? {}) as {
    nameField?: string
    valueFields?: string[]
  }
  if (!valueFields?.length) return null

  // 指标数组:优先用 nameField 列的值,否则用字段名
  const indicator = rows.value.map((r) => {
    const name = nameField ? String(r[nameField] ?? '') : ''
    // 计算该行的最大值作为 max
    const max = Math.max(
      ...valueFields.map((f) => Number(r[f] ?? 0)),
      0,
    )
    return { name, max: Math.ceil(max * 1.2) || 100 }
  })

  // 系列:每个 valueField 对应一个系列
  const series = valueFields.map((f) => ({
    name: f,
    value: rows.value.map((r) => Number(r[f] ?? 0)),
  }))

  return { indicator, series }
})

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
 * 🔑 雷达图"组件特有"option —— 只写 radar.indicator + series。
 *   radar 无 X/Y 坐标轴（hasAxes=false）。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const indicator = mappedData.value?.indicator
    ?? (Array.isArray(mergedProps.radarIndicator)
      ? mergedProps.radarIndicator
      : [
          { name: '销售', max: 6500 },
          { name: '管理', max: 16000 },
          { name: '信息技术', max: 30000 },
          { name: '客服', max: 38000 },
          { name: '研发', max: 52000 },
          { name: '市场', max: 25000 },
        ])
  const seriesData = mappedData.value?.series
    ?? (Array.isArray(mergedProps.radarSeries)
      ? mergedProps.radarSeries
      : [
          { name: '预算分配', value: [4200, 8000, 20000, 28000, 32000, 18000] },
          { name: '实际开销', value: [5000, 9000, 22000, 30000, 35000, 20000] },
        ])

  const shape = String(mergedProps.shape) as 'polygon' | 'circle'
  const splitNumber = Number(mergedProps.splitNumber)
  const splitAreaShow = !!mergedProps.splitAreaShow
  const axisNameShow = !!mergedProps.axisNameShow
  const axisNameColor = String(mergedProps.axisNameColor)
  const axisNameFontSize = Number(mergedProps.axisNameFontSize)
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

  const specificOption: ECOption = {
    radar: {
      shape,
      splitNumber,
      axisName: {
        show: axisNameShow,
        color: axisNameColor,
        fontSize: axisNameFontSize,
      },
      splitArea: {
        show: splitAreaShow,
      },
      indicator,
    },
    series: [
      {
        name: '雷达图',
        type: 'radar',
        data: seriesData.map((s: { name: string; value: number[] }, idx: number) => {
          const style = seriesStyles.find(
            (x: { name: string; color: string; labelShow: boolean }) =>
              String(x.name || '').trim() === String(s.name || '').trim(),
          )
          const itemColor =
            style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length]
          return {
            name: s.name,
            value: s.value,
            lineStyle: { color: itemColor, width: 2 },
            itemStyle: { color: itemColor },
            areaStyle: { color: itemColor, opacity: 0.2 },
            label: {
              show: !!style?.labelShow,
              fontFamily: seriesLabelFontFamily,
              fontSize: seriesLabelFontSize,
              fontWeight: seriesLabelFontWeight,
              fontStyle: seriesLabelFontStyle,
              color: seriesLabelColor,
            },
          }
        }),
      },
    ],
  }
  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: false,
      fallbackTitle: '雷达图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  // 🔑 性能优化：签名式 watch 替代 deep watch。
  //   原 deep:true 遍历 comp.props + comp.dataConfig + rows 全部元素（rows 可能 1000+ 行）。
  //   改为 JSON.stringify 签名对比小对象 + rows 浅 ref watch（仅引用变更触发）。
  [
    () => JSON.stringify(props.comp.props),
    () => JSON.stringify(props.comp.dataConfig),
    rows,
  ],
  () => {
    applyChartOption()
  },
)

// 清理定时器, 防止内存泄漏
onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
  pendingBuilder = null
})

</script>

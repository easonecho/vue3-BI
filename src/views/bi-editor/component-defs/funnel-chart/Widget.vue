<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultProps, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingOption: ECOption | null = null

const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/** 字段映射:把数据集行数据映射成漏斗图所需的 {name, value}[] */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { nameField, valueField } = (props.comp.dataConfig ?? {}) as {
    nameField?: string
    valueField?: string
  }
  if (!nameField || !valueField) return null
  return rows.value.map((r) => ({
    name: String(r[nameField] ?? ''),
    value: Number(r[valueField] ?? 0),
  }))
})

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
 * 🔑 漏斗图"组件特有"option —— 只写 series。
 *   funnel 无坐标轴，hasAxes=false；title / legend / tooltip / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = def ? deriveDefaultProps(def.propsSchema, def.extraDefaults) : {}
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const funnelData = mappedData.value
    ?? (Array.isArray(mergedProps.funnelData)
      ? mergedProps.funnelData.map((item: { name: string; value: number }) => ({
          name: item.name,
          value: item.value,
        }))
      : [
          { name: '展现', value: 900 },
          { name: '点击', value: 600 },
          { name: '访问', value: 380 },
          { name: '咨询', value: 220 },
          { name: '订单', value: 120 },
          { name: '成交', value: 60 },
        ])

  const sort = String(mergedProps.sort) as 'descending' | 'ascending' | 'none'
  const funnelAlign = String(mergedProps.funnelAlign) as 'center' | 'left' | 'right'
  const minSize = `${Number(mergedProps.minSize)}%`
  const maxSize = `${Number(mergedProps.maxSize)}%`
  const gap = Number(mergedProps.gap)
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#ffffff')
  const rawLabelPosition = String(mergedProps.seriesLabelPosition || 'inside')
  // 漏斗图 label.position 仅支持 inside / left / right，统一映射
  const funnelLabelPosition: 'inside' | 'left' | 'right' =
    rawLabelPosition === 'left' || rawLabelPosition === 'right'
      ? (rawLabelPosition as 'left' | 'right')
      : 'inside'

  const specificOption: ECOption = {
    series: [
      {
        name: '漏斗图',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        minSize,
        maxSize,
        sort,
        gap,
        funnelAlign,
        label: {
          show: true,
          position: funnelLabelPosition,
          formatter: '{b}: {c}',
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: funnelLabelPosition === 'inside' ? seriesLabelColor : '#6b7280',
        },
        labelLine: {
          show: funnelLabelPosition !== 'inside',
          length: 10,
          lineStyle: { width: 1 },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        emphasis: {
          label: { fontSize: 16, fontWeight: 'bold' as const },
        },
        data: funnelData.map((item: { name: string; value: number }, idx: number) => {
          const style = seriesStyles.find(
            (x: { name: string; color: string; labelShow: boolean }) =>
              String(x.name || '').trim() === String(item.name || '').trim(),
          )
          const out: any = { ...item }
          out.itemStyle = {
            color: style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length],
            borderColor: '#fff',
            borderWidth: 1,
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
    fallbackTitle: '漏斗图',
  })
  debouncedSetOption(merged)
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  [() => props.comp.props, rows, () => props.comp.dataConfig],
  () => {
    applyChartOption()
  },
  { deep: true },
)

// 清理定时器, 防止内存泄漏
onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
})

</script>

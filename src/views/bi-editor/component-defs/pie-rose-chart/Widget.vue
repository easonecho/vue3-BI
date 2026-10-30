<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { str, strArray, optionalStr, fontWeightOf, fontStyleOf } from '../_shared/props'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import { useChartAggregation } from '../../composables/useChartAggregation'
import { useLinkageStore } from '@/stores/linkage'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
const linkageStore = useLinkageStore()
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)

/** 🔑 名称字段 (钻取时切换为 drillFields[N-1]) */
const nameField = computed(() =>
  linkageStore.getDrillField(
    props.comp.id,
    strArray(props.comp.dataConfig.drillFields),
    str(props.comp.dataConfig.nameField),
  ),
)
const valueField = computed(() => optionalStr(props.comp.dataConfig.valueField))

/** 🔑 聚合下推:按名称字段在服务端 GROUP BY;未启用聚合时为 null → 原始行 */
const aggregateRequest = useChartAggregation(props.comp, {
  groupBy: () => nameField.value,
  metrics: () => (valueField.value ? [valueField.value] : []),
  orderBy: () => (valueField.value ? { field: valueField.value, direction: 'desc' } : undefined),
})
const { rows } = useDatasetBinding(dataSourceRef, true, aggregateRequest)

/** 字段映射:把数据集行数据映射成玫瑰图所需的 {name, value}[] */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const name = nameField.value
  const value = valueField.value
  if (!name || !value) return null
  return rows.value.map((r) => ({
    name: String(r[name] ?? ''),
    value: Number(r[value] ?? 0),
  }))
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
 * 🔑 玫瑰图"组件特有"option —— 只写 series(pie + roseType + radius)。
 *   玫瑰图无坐标轴,hasAxes=false;title / legend / tooltip / color / animation 由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const pieData = mappedData.value
    ?? (Array.isArray(mergedProps.pieData)
      ? mergedProps.pieData.map((item: { name: string; value: number }) => ({
          name: item.name,
          value: item.value,
        }))
      : [
          { name: '类别A', value: 40 },
          { name: '类别B', value: 30 },
          { name: '类别C', value: 20 },
          { name: '类别D', value: 15 },
          { name: '类别E', value: 10 },
        ])

  const roseType = String(mergedProps.roseType) as 'radius' | 'area'
  const radiusInner = Number(mergedProps.radiusInner)
  // 🔑 玫瑰图半径:[inner%, 70%],外半径固定 70%（与饼图风格保持一致）
  const radiusArr = [`${radiusInner}%`, '70%']
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = fontWeightOf(mergedProps.seriesLabelFontWeight)
  const seriesLabelFontStyle = fontStyleOf(mergedProps.seriesLabelFontStyle)
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
  // 饼图 label.position 仅支持 outside / inside / center,将通用 top/bottom/left/right 转换
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
        name: '玫瑰图',
        type: 'pie',
        radius: radiusArr,
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
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: false,
      fallbackTitle: '玫瑰图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  // 🔑 性能优化：签名式 watch 替代 deep watch
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

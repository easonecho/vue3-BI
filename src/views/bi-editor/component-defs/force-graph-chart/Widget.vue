<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { fontWeightOf, fontStyleOf } from '../_shared/props'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册关系图（运行一次,echarts/core 内部去重）
use([GraphChart])

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

/** 字段映射:把扁平 rows 转换成 {nodes, links, categories} */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  const { sourceField, targetField, valueField } = (props.comp.dataConfig ?? {}) as {
    sourceField?: string
    targetField?: string
    valueField?: string
  }
  if (!sourceField || !targetField) return null

  // 🔑 节点去重:用 Map 累加节点度数,作为 value
  const nodeMap = new Map<string, number>()
  const links: { source: string; target: string; value: number }[] = []
  for (const r of rows.value) {
    const s = String(r[sourceField] ?? '').trim()
    const t = String(r[targetField] ?? '').trim()
    if (!s || !t) continue
    nodeMap.set(s, (nodeMap.get(s) ?? 0) + 1)
    nodeMap.set(t, (nodeMap.get(t) ?? 0) + 1)
    const v = valueField ? Number(r[valueField] ?? 1) : 1
    links.push({ source: s, target: t, value: v })
  }
  // 🔑 简单分类:所有节点归为单一类别（用户可在静态数据中扩展 categories）
  const categories = [{ name: '关联节点' }]
  const nodes = Array.from(nodeMap.entries()).map(([name, value]) => ({
    name,
    value,
    category: 0,
  }))
  return { nodes, links, categories }
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
 * 🔑 力导向图"组件特有"option —— series(type:graph),layout=force + 力学参数。
 *   graph 无坐标轴,hasAxes=false；title / legend / tooltip / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  // 🔑 数据绑定优先,否则用静态 categories/nodes/links
  const mapped = mappedData.value
  const categories = mapped?.categories
    ?? (Array.isArray(mergedProps.categories) ? mergedProps.categories : [])
  const nodes = mapped?.nodes
    ?? (Array.isArray(mergedProps.nodes) ? mergedProps.nodes : [])
  const links = mapped?.links
    ?? (Array.isArray(mergedProps.links) ? mergedProps.links : [])

  const layout = String(mergedProps.layout || 'force') as 'force' | 'circular' | 'none'
  const symbolSize = Number(mergedProps.symbolSize || 20)
  const edgeLength = Number(mergedProps.edgeLength || 100)
  const repulsion = Number(mergedProps.repulsion || 200)
  const gravity = Number(mergedProps.gravity || 0.1)
  const draggable = mergedProps.draggable !== false
  const showEdgeLabel = !!mergedProps.showEdgeLabel
  const nodeColor = String(mergedProps.nodeColor)
  const edgeColor = String(mergedProps.edgeColor)

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = fontWeightOf(mergedProps.seriesLabelFontWeight)
  const seriesLabelFontStyle = fontStyleOf(mergedProps.seriesLabelFontStyle)
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')

  // 🔑 按 categories 给每个分组分配 ECharts 标准调色板颜色
  const categoryColors = categories.map(
    (_, i: number) => ECHARTS_DEFAULT_PALETTE[i % ECHARTS_DEFAULT_PALETTE.length],
  )

  const specificOption: ECOption = {
    series: [
      {
        name: '力导向图',
        type: 'graph',
        layout,
        data: nodes.map((n: any) => ({
          ...n,
          symbolSize: n.symbolSize || symbolSize,
          label: { show: true },
          category: typeof n.category === 'number' ? n.category : 0,
          itemStyle: { color: categoryColors[n.category ?? 0] || nodeColor },
        })),
        links: links.map((l: any) => ({ ...l })),
        categories,
        roam: false,
        draggable,
        edgeSymbol: ['none', 'none'],
        label: {
          show: true,
          position: 'right',
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
        },
        edgeLabel: {
          show: showEdgeLabel,
          formatter: (params: any) => (params.data.value != null ? String(params.data.value) : ''),
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          color: seriesLabelColor,
        },
        lineStyle: {
          color: edgeColor,
          width: 1.5,
          curveness: 0.2,
        },
        force:
          layout === 'force'
            ? {
                repulsion,
                edgeLength,
                gravity,
              }
            : undefined,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3 },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
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
      hasAxes: false,
      fallbackTitle: '力导向图',
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

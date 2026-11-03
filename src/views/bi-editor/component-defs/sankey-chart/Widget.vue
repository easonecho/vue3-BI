<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useChartAggregation } from '../../composables/useChartAggregation'
import { useDatasetBinding } from '../../composables/useDatasetBinding'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

/** 🔑 数据集绑定: 来源/目标双维度 GROUP BY, 汇总数值后映射为 nodes + links */
const dataSource = computed(() => props.comp.dataSource)
const dataConfig = computed(() => props.comp.dataConfig ?? {})
const sourceField = computed(() => String(dataConfig.value.sourceField || ''))
const targetField = computed(() => String(dataConfig.value.targetField || ''))
const valueField = computed(() => String(dataConfig.value.valueField || ''))
const aggregateRequest = useChartAggregation(props.comp, {
  groupBy: () =>
    sourceField.value && targetField.value
      ? [sourceField.value, targetField.value]
      : undefined,
  metrics: () => (valueField.value ? [valueField.value] : []),
  limit: 2000,
})
const { rows: datasetRows } = useDatasetBinding(dataSource, true, aggregateRequest)

const boundLinks = computed<{ source: string; target: string; value: number }[] | null>(() => {
  if (
    !props.comp.dataSource?.datasetId ||
    !sourceField.value ||
    !targetField.value ||
    !valueField.value
  ) {
    return null
  }
  return datasetRows.value
    .map((row) => ({
      source: String(row[sourceField.value] ?? ''),
      target: String(row[targetField.value] ?? ''),
      value: Number(row[valueField.value]) || 0,
    }))
    .filter((link) => link.source !== '' && link.target !== '')
})

const boundNodes = computed<{ name: string }[] | null>(() => {
  const links = boundLinks.value
  if (!links) return null
  const names = new Set<string>()
  for (const link of links) {
    names.add(link.source)
    names.add(link.target)
  }
  return Array.from(names).map((name) => ({ name }))
})

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
 * 🔑 桑基图"组件特有"option —— 只写 series（sankey）。
 *   sankey 无坐标轴，hasAxes=false；title / legend / tooltip / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const nodes =
    boundNodes.value ?? (Array.isArray(mergedProps.nodes) ? mergedProps.nodes : [])
  const links =
    boundLinks.value ?? (Array.isArray(mergedProps.links) ? mergedProps.links : [])
  const nodeWidth = Number(mergedProps.nodeWidth || 15)
  const nodeGap = Number(mergedProps.nodeGap || 10)
  const linkColor = String(mergedProps.linkColor || '#22d3ee')
  const linkOpacity = Number(mergedProps.linkOpacity ?? 0.5)

  const specificOption: ECOption = {
    series: [
      {
        name: '桑基图',
        type: 'sankey',
        data: nodes,
        links,
        nodeWidth,
        nodeGap,
        lineStyle: {
          color: linkColor,
          opacity: linkOpacity,
          curveness: 0.5,
        },
        label: {
          show: true,
        },
        emphasis: {
          focus: 'adjacency',
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
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: false,
      fallbackTitle: '桑基图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  [
    () => JSON.stringify(props.comp.props),
    () => JSON.stringify(boundNodes.value),
    () => JSON.stringify(boundLinks.value),
  ],
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

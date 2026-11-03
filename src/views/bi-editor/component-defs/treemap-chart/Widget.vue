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

/** 🔑 数据集绑定: 类目 + 度量在服务端 GROUP BY, 映射为 treemap 的 { name, value } */
const dataSource = computed(() => props.comp.dataSource)
const dataConfig = computed(() => props.comp.dataConfig ?? {})
const categoryField = computed(() => String(dataConfig.value.categoryField || ''))
const valueField = computed(() => String(dataConfig.value.valueField || ''))
const aggregateRequest = useChartAggregation(props.comp, {
  groupBy: () => categoryField.value || undefined,
  metrics: () => (valueField.value ? [valueField.value] : []),
  limit: 2000,
})
const { rows: datasetRows } = useDatasetBinding(dataSource, true, aggregateRequest)

const boundData = computed<{ name: string; value: number }[] | null>(() => {
  if (!props.comp.dataSource?.datasetId || !categoryField.value || !valueField.value) {
    return null
  }
  return datasetRows.value
    .map((row) => ({
      name: String(row[categoryField.value] ?? ''),
      value: Number(row[valueField.value]) || 0,
    }))
    .filter((item) => item.name !== '')
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
 * 🔑 树图"组件特有"option —— 只写 series（treemap）。
 *   treemap 无坐标轴，hasAxes=false；title / legend / tooltip / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const data = boundData.value ?? (Array.isArray(mergedProps.data) ? mergedProps.data : [])
  const visualDimension = String(mergedProps.visualDimension || 'value')
  const colorFrom = String(mergedProps.colorFrom || '#67e8f9')
  const colorTo = String(mergedProps.colorTo || '#0e7490')
  const leafDepth = Number(mergedProps.leafDepth || 2)

  const specificOption: ECOption = {
    series: [
      {
        name: '树图',
        type: 'treemap',
        data,
        roam: false,
        leafDepth,
        // 🔑 levels 颜色映射：colorMappingBy:'value' + visualDimension
        visualDimension: visualDimension === 'value' ? 'value' : undefined,
        label: {
          show: true,
          formatter: '{b}',
        },
        upperLabel: {
          show: true,
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#1e293b',
              borderWidth: 2,
              gapWidth: 2,
            },
          },
          {
            colorMappingBy: 'value',
            color: [colorFrom, colorTo],
            itemStyle: {
              borderColor: '#334155',
              borderWidth: 1,
              gapWidth: 1,
            },
          },
        ],
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
      fallbackTitle: '树图',
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch(
  [() => JSON.stringify(props.comp.props), () => JSON.stringify(boundData.value)],
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

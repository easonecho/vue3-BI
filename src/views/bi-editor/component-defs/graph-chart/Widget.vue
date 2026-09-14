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
 * 🔑 关系图"组件特有"option —— 只写 series（graph）。
 *   graph 无坐标轴，hasAxes=false；title / legend / tooltip / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const categories = Array.isArray(mergedProps.categories) ? mergedProps.categories : []
  const nodes = Array.isArray(mergedProps.nodes) ? mergedProps.nodes : []
  const links = Array.isArray(mergedProps.links) ? mergedProps.links : []
  const layout = String(mergedProps.layout || 'force') as 'force' | 'circular' | 'none'
  const draggable = mergedProps.draggable !== false
  const nodeSize = Number(mergedProps.nodeSize || 20)
  const linkColor = String(mergedProps.linkColor || '#475569')

  const specificOption: ECOption = {
    series: [
      {
        name: '关系图',
        type: 'graph',
        layout,
        data: nodes.map((n: any) => ({
          ...n,
          symbolSize: n.symbolSize || nodeSize,
          label: { show: true },
          category: n.category,
        })),
        links,
        categories,
        roam: false,
        draggable,
        lineStyle: {
          color: linkColor,
          curveness: 0.2,
        },
        label: {
          show: true,
          position: 'right',
        },
        force:
          layout === 'force'
            ? {
                repulsion: 200,
                edgeLength: 80,
                gravity: 0.1,
              }
            : undefined,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3 },
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
      fallbackTitle: '关系图',
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

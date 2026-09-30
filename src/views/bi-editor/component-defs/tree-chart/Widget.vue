<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { TreeChart } from 'echarts/charts'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

// 🔑 模块级注册树图（运行一次,echarts/core 内部去重）
use([TreeChart])

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
let initTimer: number | undefined

let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时取数（树图数据是嵌套结构,优先用静态 treeData）
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)

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
 * 🔑 把扁平数据集行（每行 name + 可选 parent）构造成嵌套树。
 *   仅当用户配置了 treeField 且数据中存在 parent 字段时启用,否则用静态 treeData。
 */
function buildTreeFromRows(
  rowsList: Record<string, unknown>[],
  nameField: string,
  parentField = 'parent',
): any | null {
  if (!rowsList.length) return null
  const nodeMap = new Map<string, any>()
  const roots: any[] = []
  // 第一遍:创建所有节点
  for (const row of rowsList) {
    const name = String(row[nameField] ?? '').trim()
    if (!name || nodeMap.has(name)) continue
    nodeMap.set(name, { name, children: [], raw: row })
  }
  // 第二遍:挂载 parent → children
  for (const [name, node] of nodeMap.entries()) {
    const parentName = String(node.raw[parentField] ?? '').trim()
    if (parentName && nodeMap.has(parentName)) {
      nodeMap.get(parentName)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  // 移除空 children 数组（叶子节点不挂 children,避免渲染空折叠）
  const cleanup = (n: any) => {
    if (Array.isArray(n.children) && n.children.length === 0) delete n.children
    else if (Array.isArray(n.children)) n.children.forEach(cleanup)
  }
  roots.forEach(cleanup)
  return roots.length === 1 ? roots[0] : { name: 'root', children: roots }
}

/**
 * 🔑 树图"组件特有"option —— 单 series(type:tree),data 直接是嵌套树。
 *   tree 无坐标轴,hasAxes=false；title / legend / tooltip / animation 统一由 applyUserChartConfig 生成。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  // 🔑 数据绑定优先（仅当存在 datasetId + treeField 时构造嵌套树）
  const { treeField } = (props.comp.dataConfig ?? {}) as { treeField?: string }
  let treeData = mergedProps.treeData
  if (
    props.comp.dataSource.datasetId &&
    rows.value.length > 0 &&
    typeof treeField === 'string' &&
    treeField
  ) {
    const built = buildTreeFromRows(rows.value, treeField)
    if (built) treeData = built
  }
  if (!treeData) treeData = { name: 'root' }

  const layout = String(mergedProps.layout || 'orthogonal') as 'orthogonal' | 'radial'
  const orient = String(mergedProps.orient || 'LR') as 'LR' | 'TB' | 'RL' | 'BT'
  const symbol = String(mergedProps.symbol || 'emptyCircle')
  const symbolSize = Number(mergedProps.symbolSize || 8)
  const edgeShape = String(mergedProps.lineStyle || 'curve') as 'curve' | 'polyline'
  const expandAll = mergedProps.expandAll !== false
  const initialLevel = Number(mergedProps.initialLevel ?? 2)
  const nodeColor = String(mergedProps.nodeColor)
  const lineColor = String(mergedProps.lineColor)

  // 🔑 系列标签样式：独立 5 项配置
  const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
  const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
  const seriesLabelFontWeight = mergedProps.seriesLabelFontWeight as any
  const seriesLabelFontStyle = mergedProps.seriesLabelFontStyle as any
  const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')

  const specificOption: ECOption = {
    series: [
      {
        name: '树图',
        type: 'tree',
        data: [treeData],
        top: '8%',
        left: '12%',
        bottom: '8%',
        right: '20%',
        layout,
        // 🔑 orient 仅在 orthogonal 布局下生效
        orient: layout === 'orthogonal' ? orient : undefined,
        symbol,
        symbolSize,
        edgeShape,
        initialTreeDepth: expandAll ? -1 : initialLevel,
        label: {
          show: true,
          position: 'left',
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
        },
        itemStyle: { color: nodeColor },
        lineStyle: { color: lineColor, width: 1.5 },
        emphasis: {
          focus: 'descendant',
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
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
      fallbackTitle: '树图',
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

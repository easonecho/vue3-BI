<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig, getXAxisData } from '../_shared/echarts-options'
import { str, strArray, fontWeightOf, fontStyleOf, labelPositionOf } from '../_shared/props'
import { deriveDefaultPropsCached, ECHARTS_DEFAULT_PALETTE } from '../types'
import { getDefinition } from '../index'
import { BAR_MAX_WIDTH } from './index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import { useChartAggregation } from '../../composables/useChartAggregation'
import { useLinkageStore } from '@/stores/linkage'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
const linkageStore = useLinkageStore()
let initTimer: number | undefined

/** 防抖定时器 */
let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

// 🔑 数据绑定:有 datasetId 时走动态取数 + 字段映射,无则走静态兜底
const dataSourceRef = computed(() => props.comp.dataSource)

/** 🔑 类目字段 (钻取时切换为 drillFields[N-1]) */
const categoryField = computed(() =>
  linkageStore.getDrillField(
    props.comp.id,
    strArray(props.comp.dataConfig.drillFields),
    str(props.comp.dataConfig.categoryField),
  ),
)
const valueFields = computed<string[]>(() => strArray(props.comp.dataConfig.valueFields))

/** 🔑 聚合下推:按类目在服务端 GROUP BY;未启用聚合时为 null → 原始行 */
const aggregateRequest = useChartAggregation(props.comp, {
  groupBy: () => categoryField.value,
  metrics: () => valueFields.value,
  orderBy: () => (categoryField.value ? { field: categoryField.value, direction: 'asc' } : undefined),
})
const { rows } = useDatasetBinding(dataSourceRef, true, aggregateRequest)

/** 字段映射:把数据集行数据映射成柱状图所需的 {categories, series} */
const mappedData = computed(() => {
  if (!props.comp.dataSource.datasetId || rows.value.length === 0) return null
  if (!categoryField.value || valueFields.value.length === 0) return null
  return {
    categories: rows.value.map((r) => String(r[categoryField.value] ?? '')),
    series: valueFields.value.map((f) => ({
      name: f,
      data: rows.value.map((r) => Number(r[f] ?? 0)),
    })),
  }
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
 * 🔑 柱状图"组件特有"option —— 只写 series / 柱宽 / 堆叠 等特有配置。
 *   title / legend / xAxis / yAxis / tooltip / color / animation 统一由 applyUserChartConfig 生成，
 *   用户在右侧属性面板修改后立即生效。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  // 🔑 合并默认值：schema defaults → actual props（用户设置优先级更高）
  //   1) 保证 barWidth / barGap / stack 等特有字段也享受 schema 默认值
  //   2) 旧数据或新增字段缺失时也能正常工作
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const categories = mappedData.value?.categories
    ?? (Array.isArray(mergedProps.categories)
      ? mergedProps.categories
      : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'])
  const seriesData = mappedData.value?.series
    ?? (Array.isArray(mergedProps.series)
      ? mergedProps.series
      : [{ name: '数据', data: [120, 200, 150, 80, 70, 110, 130] }])
  const barWidth = Number(mergedProps.barWidth)
  const barGapPercent = `${Number(mergedProps.barGap)}%`
  const stack = !!mergedProps.stack
  const seriesStyles = Array.isArray(mergedProps.seriesStyles) ? mergedProps.seriesStyles : []

  const specificOption: ECOption = {
    xAxis: {
      // 只传 data，样式（颜色/字号/轴线/网格线）由 applyUserChartConfig 根据用户配置生成
      data: categories,
    },
    series: seriesData.map((s: { name: string; data: number[] }, idx: number) => {
      // 🔑 按 series name 匹配 seriesStyles 中配置的单独样式
      const style = seriesStyles.find(
        (x: { seriesName: string; color: string; borderRadius: number; labelShow: boolean }) =>
          String(x.seriesName || '').trim() === String(s.name || '').trim(),
      )
      const itemStyle: Record<string, any> = {}
      // 🔑 颜色兜底：seriesStyles 未配置时按 index 取 ECHARTS 标准调色板
      itemStyle.color =
        style?.color || ECHARTS_DEFAULT_PALETTE[idx % ECHARTS_DEFAULT_PALETTE.length]
      if (typeof style?.borderRadius === 'number') itemStyle.borderRadius = style.borderRadius
      const showLabel = !!style?.labelShow

      // 🔑 系列标签样式：独立 5 项配置（不再跟随全局）
      const seriesLabelFontFamily = String(mergedProps.seriesLabelFontFamily)
      const seriesLabelFontSize = Number(mergedProps.seriesLabelFontSize || 12)
      const seriesLabelFontWeight = fontWeightOf(mergedProps.seriesLabelFontWeight)
      const seriesLabelFontStyle = fontStyleOf(mergedProps.seriesLabelFontStyle)
      const seriesLabelColor = String(mergedProps.seriesLabelColor || '#6b7280')
      const seriesLabelPosition = String(mergedProps.seriesLabelPosition || 'top')

      return {
        name: s.name,
        type: 'bar',
        data: s.data,
        barWidth,
        barMaxWidth: BAR_MAX_WIDTH,
        barGap: barGapPercent,
        stack: stack ? 'total' : undefined,
        itemStyle,
        label: {
          show: showLabel,
          position: labelPositionOf(seriesLabelPosition),
          fontFamily: seriesLabelFontFamily,
          fontSize: seriesLabelFontSize,
          fontWeight: seriesLabelFontWeight,
          fontStyle: seriesLabelFontStyle,
          color: seriesLabelColor,
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
        },
      }
    }),
  }
  return { specificOption, mergedProps }
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const { specificOption, mergedProps } = getChartSpecificOption()
    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: true,
      xAxisData: getXAxisData(specificOption),
      fallbackTitle: '柱状图',
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

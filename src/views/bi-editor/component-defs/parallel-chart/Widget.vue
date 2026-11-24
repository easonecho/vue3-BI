<template>
  <BaseChart ref="baseChartRef" :comp="comp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import type { ComponentInstance } from '@/views/bi-editor/types'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ comp: ComponentInstance }>()
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)
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
 * 数据集绑定：把勾选的指标字段映射为平行坐标的维度与数据行。
 * 至少需要 2 个字段，否则返回 null 沿用静态示例数据。
 */
function buildBoundParallel(): { dimensions: Array<{ name: string }>; data: number[][] } | null {
  if (!props.comp.dataSource?.datasetId || rows.value.length === 0) return null
  const cfg = (props.comp.dataConfig ?? {}) as Record<string, unknown>
  const fields = Array.isArray(cfg.dimensionFields)
    ? (cfg.dimensionFields as unknown[]).map((f) => String(f)).filter(Boolean)
    : []
  if (fields.length < 2) return null

  const data: number[][] = []
  for (const row of rows.value) {
    const values = fields.map((f) => Number(row[f]))
    if (values.some((v) => !Number.isFinite(v))) continue
    data.push(values)
  }
  if (data.length === 0) return null
  return { dimensions: fields.map((name) => ({ name })), data }
}

/**
 * 🔑 平行坐标图"组件特有"option —— parallel 系列 + parallelAxis + parallel 布局。
 *   无传统 X/Y 坐标轴，hasAxes=false。
 */
function getChartSpecificOption(): {
  specificOption: ECOption
  mergedProps: Record<string, any>
} {
  const def = getDefinition(props.comp.type)
  const schemaDefaults = deriveDefaultPropsCached(def)
  const mergedProps = { ...schemaDefaults, ...props?.comp?.props }

  const bound = buildBoundParallel()
  const dimensions: Array<{ name: string; max?: number }> =
    bound?.dimensions ?? (Array.isArray(mergedProps.dimensions) ? mergedProps.dimensions : [])
  const data: number[][] = bound?.data ?? (Array.isArray(mergedProps.data) ? mergedProps.data : [])

  const lineColor = String(mergedProps.lineColor || '#22d3ee')
  const lineOpacity = Number(mergedProps.lineOpacity ?? 0.5)
  const lineWidth = Number(mergedProps.lineWidth || 1.5)
  const axisColor = String(mergedProps.axisColor || '#475569')
  const labelColor = String(mergedProps.labelColor || '#e2e8f0')

  const parallelAxis = dimensions.map((d, i) => ({
    dim: i,
    max: d.max,
    name: d.name,
    nameLocation: 'end',
    nameGap: 20,
    axisLine: { lineStyle: { color: axisColor } },
    axisLabel: { color: labelColor },
  }))

  const specificOption: ECOption = {
    parallelAxis,
    parallel: {
      axisExpandable: true,
      axisExpandCenter: 2,
      parallelAxisDefault: {
        nameTextStyle: { color: labelColor },
      },
    },
    series: [
      {
        type: 'parallel',
        data,
        lineStyle: {
          color: lineColor,
          opacity: lineOpacity,
          width: lineWidth,
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
      fallbackTitle: t('editorMaterial.meta.parallelChart'),
    })
  })
}

onMounted(async () => {
  initTimer = window.setTimeout(applyChartOption, 50)
})

watch([() => JSON.stringify(props.comp.props), () => props.comp.dataConfig, rows], () => {
  applyChartOption()
})

onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
  pendingBuilder = null
})
</script>

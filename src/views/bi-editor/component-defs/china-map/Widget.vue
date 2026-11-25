<template>
  <div class="widget-china-map" :style="containerStyle">
    <div v-if="mapError" class="china-map-error">{{ mapError }}</div>
    <BaseChart ref="baseChartRef" :comp="comp" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import { registerMap } from 'echarts/core'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { buildChinaMapNameMap, chinaMapRegionName } from './province-names'

import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps<{ comp: ComponentInstance }>()
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows } = useDatasetBinding(dataSourceRef)
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null)
const mapError = ref<string>('')
let initTimer: number | undefined
let debounceTimer: number | null = null
let pendingBuilder: (() => ECOption) | null = null

const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative' as const,
}

/** 🔑 模块级标记：避免重复注册 'china' map */
let _mapRegistered = false
let _mapLoading: Promise<void> | null = null

const CHINA_GEO_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json'

function ensureChinaMap(): Promise<void> {
  if (_mapRegistered) return Promise.resolve()
  if (_mapLoading) return _mapLoading
  _mapLoading = (async () => {
    try {
      const res = await fetch(CHINA_GEO_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const geoJson: unknown = await res.json()
      // 🔑 远端 GeoJSON 无法在编译期校验结构，这里断言成 registerMap 的入参类型
      registerMap('china', geoJson as Parameters<typeof registerMap>[1])
      _mapRegistered = true
    } catch (e) {
      console.error('[china-map] 加载中国地图 GeoJSON 失败:', e)
      throw e
    } finally {
      _mapLoading = null
    }
  })()
  return _mapLoading
}

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
 * 数据集绑定：把地区名称 / 数值字段映射为地图 series 数据。
 * 未配置字段或结果为空时返回 null，沿用静态示例数据。
 */
function buildBoundMapData(): Array<{ name: string; value: number }> | null {
  if (!props.comp.dataSource?.datasetId || rows.value.length === 0) return null
  const cfg = (props.comp.dataConfig ?? {}) as Record<string, unknown>
  const nameField = String(cfg.nameField ?? '')
  const valueField = String(cfg.valueField ?? '')
  if (!nameField || !valueField) return null

  const data: Array<{ name: string; value: number }> = []
  for (const row of rows.value) {
    const name = String(row[nameField] ?? '').trim()
    if (!name) continue
    const value = Number(row[valueField] ?? 0)
    data.push({ name, value: Number.isFinite(value) ? value : 0 })
  }
  return data.length > 0 ? data : null
}

function applyChartOption() {
  if (!_mapRegistered) return
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const def = getDefinition(props.comp.type)
    const mergedProps = { ...deriveDefaultPropsCached(def), ...props?.comp?.props }

    const boundMapData = buildBoundMapData()
    const rawMapData: Array<Record<string, unknown>> = boundMapData
      ? boundMapData
      : Array.isArray(mergedProps.data)
        ? (mergedProps.data as Array<Record<string, unknown>>)
        : []
    // 🔑 GeoJSON 区域名为全称（北京市），数据集常用简称（北京），这里统一换算
    const currentLocale = locale.value
    const mapData = rawMapData.map((item) => ({
      ...item,
      name: chinaMapRegionName(String(item.name ?? ''), currentLocale),
    }))
    const nameMap = buildChinaMapNameMap(currentLocale)
    // 绑定数据集时按实际最大值映射颜色，静态示例保持 0-100
    const visualMax = boundMapData ? Math.max(...boundMapData.map((d) => d.value), 1) : 100
    const mapColor = String(mergedProps.mapColor)
    const mapBorderColor = String(mergedProps.mapBorderColor)
    const mapBorderWidth = Number(mergedProps.mapBorderWidth)
    const emphasisColor = String(mergedProps.emphasisColor)
    const visualOn = !!mergedProps.visualOn
    const visualFrom = String(mergedProps.visualFrom)
    const visualTo = String(mergedProps.visualTo)
    const labelShow = !!mergedProps.labelShow
    const labelColor = String(mergedProps.labelColor)

    const specificOption: any = {
      series: [
        {
          type: 'map',
          map: 'china',
          nameMap,
          data: mapData,
          roam: false,
          label: { show: labelShow, color: labelColor },
          itemStyle: {
            areaColor: mapColor,
            borderColor: mapBorderColor,
            borderWidth: mapBorderWidth,
          },
          emphasis: {
            label: { show: true },
            itemStyle: { areaColor: emphasisColor },
          },
        },
      ],
    }

    // 🔑 visualMap 始终声明，避免 setOption merge 模式下旧 visualMap 残留
    //   开启：渐变色映射；关闭：所有值映射为 mapColor（视觉上等同于无 visualMap）
    if (visualOn) {
      specificOption.visualMap = {
        show: true,
        type: 'continuous',
        min: 0,
        max: visualMax,
        calculable: true,
        inRange: { color: [visualFrom, visualTo] },
        textStyle: { color: '#e2e8f0' },
      }
    } else {
      specificOption.visualMap = {
        show: false,
        type: 'continuous',
        min: 0,
        max: visualMax,
        calculable: false,
        inRange: { color: [mapColor, mapColor] },
        textStyle: { color: '#e2e8f0' },
      }
    }

    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: false,
      fallbackTitle: t('editorMaterial.meta.chinaMap'),
    })
  })
}

onMounted(async () => {
  try {
    mapError.value = ''
    await ensureChinaMap()
    initTimer = window.setTimeout(applyChartOption, 50)
  } catch {
    mapError.value = t('editorMaterial.ui.mapLoadFailed')
  }
})

watch([() => JSON.stringify(props.comp.props), () => props.comp.dataConfig, rows], () => {
  applyChartOption()
})

// 语言切换后刷新区域名（中文全称 / 英文名）
watch(locale, () => {
  applyChartOption()
})

onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  if (debounceTimer !== null) cancelAnimationFrame(debounceTimer)
  pendingBuilder = null
})
</script>

<style scoped lang="less">
.widget-china-map {
  width: 100%;
  height: 100%;
  position: relative;
}

.china-map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ef4444;
  font-size: 14px;
  z-index: 10;
  pointer-events: none;
  text-align: center;
}
</style>

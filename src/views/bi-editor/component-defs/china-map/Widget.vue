<template>
  <div class="widget-china-map" :style="containerStyle">
    <div v-if="mapError" class="china-map-error">{{ mapError }}</div>
    <BaseChart ref="baseChartRef" :comp="comp" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { ECOption } from '../_shared/echarts-config'
import BaseChart from '../_shared/BaseChart.vue'
import { getBaseOption, applyUserChartConfig } from '../_shared/echarts-options'
import { deriveDefaultPropsCached } from '../types'
import { getDefinition } from '../index'
import { registerMap } from 'echarts/core'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()
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
      const geoJson = await res.json()
      registerMap('china', geoJson as any)
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

function applyChartOption() {
  if (!_mapRegistered) return
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const def = getDefinition(props.comp.type)
    const mergedProps = { ...deriveDefaultPropsCached(def), ...props?.comp?.props }

    const mapData = Array.isArray(mergedProps.data) ? mergedProps.data : []
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
        max: 100,
        calculable: true,
        inRange: { color: [visualFrom, visualTo] },
        textStyle: { color: '#e2e8f0' },
      }
    } else {
      specificOption.visualMap = {
        show: false,
        type: 'continuous',
        min: 0,
        max: 100,
        calculable: false,
        inRange: { color: [mapColor, mapColor] },
        textStyle: { color: '#e2e8f0' },
      }
    }

    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: false,
      fallbackTitle: '中国地图',
    })
  })
}

onMounted(async () => {
  try {
    mapError.value = ''
    await ensureChinaMap()
    initTimer = window.setTimeout(applyChartOption, 50)
  } catch (e) {
    mapError.value = '地图数据加载失败，请检查网络连接'
  }
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

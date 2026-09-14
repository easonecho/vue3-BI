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

interface PlacedWord {
  name: string
  value: number
  x: number
  y: number
  fontSize: number
  color: string
  rotate: number
}

interface PlacedRect {
  x: number
  y: number
  w: number
  h: number
}

/** 估算文本宽度：CJK 字符约等于 fontSize，拉丁/数字约为 0.6 * fontSize */
function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0
  for (const ch of String(text)) {
    const code = ch.charCodeAt(0)
    const isCJK =
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x3000 && code <= 0x303f) ||
      (code >= 0xff00 && code <= 0xffef)
    width += isCJK ? fontSize : fontSize * 0.6
  }
  return width
}

/**
 * 🔑 词云布局算法：阿基米德螺旋 + 矩形 AABB 碰撞检测
 *  1. 按 value 降序排序
 *  2. fontSize = minFontSize + (maxFontSize - minFontSize) * (value - min) / (max - min)
 *  3. 从中心开始，按螺旋逐个放置词，检测碰撞（留 gridSize/2 padding）
 *  4. 每个词随机分配 rotateAngles 中的一个角度
 *  5. 每个词随机分配三种文字色之一
 */
function layoutWords(
  words: { name: string; value: number }[],
  opts: {
    minFontSize: number
    maxFontSize: number
    rotate: boolean
    rotateAngles: string
    gridSize: number
    colors: string[]
  },
): PlacedWord[] {
  if (!words || words.length === 0) return []

  const sorted = [...words].sort((a, b) => Number(b.value) - Number(a.value))
  const values = sorted.map((w) => Number(w.value) || 0)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  const angles = opts.rotate
    ? opts.rotateAngles
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n))
    : [0]
  const colors = opts.colors

  const placed: PlacedRect[] = []
  const result: PlacedWord[] = []
  const padding = opts.gridSize / 2

  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i]
    const fontSize =
      opts.minFontSize + (opts.maxFontSize - opts.minFontSize) * (Number(w.value) - min) / range
    const textW = estimateTextWidth(w.name, fontSize)
    const textH = fontSize
    const angle = angles.length > 0 ? angles[Math.floor(Math.random() * angles.length)] : 0
    const isVertical = Math.abs(angle - 90) < 1
    const boxW = isVertical ? textH : textW
    const boxH = isVertical ? textW : textH
    const color = colors[Math.floor(Math.random() * colors.length)]

    let theta = 0
    let placedOk = false
    for (let iter = 0; iter < 1000; iter++) {
      const r = 8 * theta
      const cx = r * Math.cos(theta)
      const cy = r * Math.sin(theta)
      const newRect: PlacedRect = {
        x: cx - boxW / 2,
        y: cy - boxH / 2,
        w: boxW,
        h: boxH,
      }
      let collision = false
      for (const p of placed) {
        if (
          newRect.x - padding < p.x + p.w + padding &&
          newRect.x + newRect.w + padding > p.x - padding &&
          newRect.y - padding < p.y + p.h + padding &&
          newRect.y + newRect.h + padding > p.y - padding
        ) {
          collision = true
          break
        }
      }
      if (!collision) {
        placed.push(newRect)
        result.push({
          name: w.name,
          value: Number(w.value),
          x: cx,
          y: cy,
          fontSize,
          color,
          rotate: angle,
        })
        placedOk = true
        break
      }
      theta += 0.1
    }
    if (!placedOk) {
      // 放弃布局，放置在中心（允许重叠）
      result.push({
        name: w.name,
        value: Number(w.value),
        x: 0,
        y: 0,
        fontSize,
        color,
        rotate: angle,
      })
    }
  }
  return result
}

function applyChartOption() {
  debouncedSetOption(() => {
    const baseOption = getBaseOption()
    const def = getDefinition(props.comp.type)
    const mergedProps = { ...deriveDefaultPropsCached(def), ...props?.comp?.props }

    const words = Array.isArray(mergedProps.words) ? mergedProps.words : []
    const minFontSize = Number(mergedProps.minFontSize)
    const maxFontSize = Number(mergedProps.maxFontSize)
    const textColor = String(mergedProps.textColor)
    const textColor2 = String(mergedProps.textColor2)
    const textColor3 = String(mergedProps.textColor3)
    const rotate = !!mergedProps.rotate
    const rotateAngles = String(mergedProps.rotateAngles)
    const gridSize = Number(mergedProps.gridSize)

    const layout = layoutWords(words, {
      minFontSize,
      maxFontSize,
      rotate,
      rotateAngles,
      gridSize,
      colors: [textColor, textColor2, textColor3],
    })

    const specificOption: ECOption = {
      grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
      xAxis: { show: false, type: 'value', scale: true },
      yAxis: { show: false, type: 'value', scale: true },
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p?.data?.name ?? ''}: ${p?.data?.value ?? ''}`,
      },
      series: [
        {
          type: 'scatter',
          symbolSize: 0,
          data: layout.map((w) => ({
            value: [w.x, w.y],
            name: w.name,
            label: {
              show: true,
              formatter: w.name,
              fontSize: w.fontSize,
              color: w.color,
              rotate: w.rotate,
            },
          })),
          label: {
            show: true,
            formatter: '{b}',
          },
          emphasis: {
            focus: 'self',
          },
        },
      ],
    }

    return applyUserChartConfig(baseOption, mergedProps, specificOption, {
      hasAxes: false,
      fallbackTitle: '词云',
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

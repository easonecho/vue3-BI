<template>
  <div class="widget-qrcode">
    <canvas ref="canvasRef" :width="size" :height="size" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const content = computed(() => props.comp.props?.content ?? 'https://trae.com')
const size = computed(() => props.comp.props?.size ?? 160)
const fgColor = computed(() => props.comp.props?.fgColor ?? '#000000')
const bgColor = computed(() => props.comp.props?.bgColor ?? '#ffffff')
const margin = computed(() => props.comp.props?.margin ?? 2)

// 简单字符串 hash —— 用 content 当种子
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0
  }
  return hash
}

// 基于 content 生成 21x21 伪随机黑白矩阵，并叠加三个定位图案
function generateMatrix(text: string): number[][] {
  const N = 21
  const matrix: number[][] = Array.from({ length: N }, () => new Array(N).fill(0))
  let seed = hashString(text || 'qrcode')

  // xorshift 伪随机数
  const rand = () => {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    seed = seed >>> 0
    return seed / 0xffffffff
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      matrix[r][c] = rand() < 0.5 ? 0 : 1
    }
  }

  // 7x7 定位图案：黑色外框 + 3x3 黑色中心
  const drawFinder = (startR: number, startC: number) => {
    for (let i = 0; i < 7; i++) {
      matrix[startR][startC + i] = 1
      matrix[startR + 6][startC + i] = 1
      matrix[startR + i][startC] = 1
      matrix[startR + i][startC + 6] = 1
    }
    for (let i = 1; i < 6; i++) {
      for (let j = 1; j < 6; j++) {
        if (i === 1 || i === 5 || j === 1 || j === 5) {
          matrix[startR + i][startC + j] = 0
        }
      }
    }
    for (let i = 2; i < 5; i++) {
      for (let j = 2; j < 5; j++) {
        matrix[startR + i][startC + j] = 1
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, N - 7)
  drawFinder(N - 7, 0)
  return matrix
}

function drawQR() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const px = size.value
  canvas.width = px
  canvas.height = px

  // 背景
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, px, px)

  // 绘制黑色单元
  const matrix = generateMatrix(content.value)
  const N = matrix.length
  const m = margin.value
  const total = N + m * 2
  const cell = px / total
  ctx.fillStyle = fgColor.value
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + m) * cell, (r + m) * cell, cell, cell)
      }
    }
  }
}

onMounted(drawQR)
watch([content, size, fgColor, bgColor, margin], drawQR)
</script>

<style scoped lang="less">
.widget-qrcode {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
</style>

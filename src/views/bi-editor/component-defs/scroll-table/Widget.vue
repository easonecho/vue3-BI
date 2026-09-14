<template>
  <div class="widget-scroll-table" :style="containerStyle">
    <div v-if="showHeader" class="st-header" :style="headerStyle">
      <div
        v-for="col in columns"
        :key="col.key"
        class="st-cell"
        :style="cellStyle(col)"
      >
        {{ col.title }}
      </div>
    </div>
    <div
      ref="bodyRef"
      class="st-body"
      @mouseenter="onBodyEnter"
      @mouseleave="onBodyLeave"
    >
      <div
        v-for="(row, idx) in renderRows"
        :key="idx"
        class="st-row"
        :style="rowStyleVars(idx)"
      >
        <div
          v-for="col in columns"
          :key="col.key"
          class="st-cell"
          :style="cellStyle(col)"
        >
          <span :style="col.key === 'level' ? levelStyle(row[col.key]) : null">{{ row[col.key] }}</span>
        </div>
      </div>
      <div v-if="renderRows.length === 0" class="st-empty">暂无数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

interface TableColumn {
  key: string
  title: string
  width?: number
}

const props = defineProps<{ comp: ComponentInstance }>()

const columns = computed<TableColumn[]>(() => {
  const cols = props.comp.props?.columns
  return Array.isArray(cols) && cols.length > 0 ? cols : []
})

const dataRows = computed<any[]>(() => {
  const data = props.comp.props?.data
  return Array.isArray(data) ? data : []
})

// 渲染列表：复制一份连接在尾部，便于无缝循环滚动
const renderRows = computed<any[]>(() => {
  const rows = dataRows.value
  if (rows.length === 0) return []
  return [...rows, ...rows]
})

const showHeader = computed(() => props.comp.props?.showHeader ?? true)
const stripe = computed(() => props.comp.props?.stripe ?? true)
const fontSize = computed(() => Number(props.comp.props?.fontSize ?? 12))
const headerBg = computed(() => String(props.comp.props?.headerBg ?? '#1e293b'))
const headerColor = computed(() => String(props.comp.props?.headerColor ?? '#67e8f9'))
const rowColor = computed(() => String(props.comp.props?.rowColor ?? '#e2e8f0'))
const rowBgColor = computed(() => String(props.comp.props?.rowBgColor ?? 'rgba(15,23,42,0.6)'))
const rowHoverBg = computed(() => String(props.comp.props?.rowHoverBg ?? 'rgba(34,211,238,0.15)'))
const border = computed(() => props.comp.props?.border ?? true)
const autoScroll = computed(() => props.comp.props?.autoScroll ?? true)
const interval = computed(() => Number(props.comp.props?.interval ?? 2000))
const step = computed(() => Number(props.comp.props?.step ?? 1))
const pauseOnHover = computed(() => props.comp.props?.pauseOnHover ?? true)

// 行高 = fontSize + 8px
const rowHeight = computed(() => fontSize.value + 8)

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  border: border.value ? '1px solid #334155' : 'none',
  display: 'flex',
  flexDirection: 'column' as const,
  fontSize: `${fontSize.value}px`,
  overflow: 'hidden',
}))

const headerStyle = computed(() => ({
  display: 'flex',
  backgroundColor: headerBg.value,
  color: headerColor.value,
  height: `${rowHeight.value}px`,
  lineHeight: `${rowHeight.value}px`,
  fontWeight: 600,
  flexShrink: 0,
  borderBottom: '1px solid #334155',
}))

const bodyStyle = computed(() => ({
  flex: '1 1 auto',
  overflow: 'hidden',
  position: 'relative' as const,
}))

function cellStyle(col: TableColumn) {
  return {
    width: col.width ? `${col.width}px` : 'auto',
    flex: col.width ? '0 0 auto' : '1 1 auto',
    padding: '0 8px',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
    boxSizing: 'border-box' as const,
  }
}

function rowBg(idx: number): string {
  if (!stripe.value) return rowBgColor.value
  // 偶数行用 rowBgColor，奇数行用稍深背景
  return idx % 2 === 0 ? rowBgColor.value : 'rgba(30,41,59,0.6)'
}

function rowStyleVars(idx: number) {
  return {
    '--st-bg': rowBg(idx),
    '--st-hover-bg': rowHoverBg.value,
    height: `${rowHeight.value}px`,
    lineHeight: `${rowHeight.value}px`,
    color: rowColor.value,
    display: 'flex',
  }
}

function levelStyle(value: any) {
  const v = String(value ?? '')
  if (v === '严重') return { color: '#ef4444', fontWeight: 600 }
  if (v === '警告') return { color: '#f59e0b', fontWeight: 600 }
  if (v === '提示') return { color: '#3b82f6', fontWeight: 600 }
  return null
}

const bodyRef = ref<HTMLDivElement | null>(null)
let scrollTimer: number | null = null
let isPaused = false

function startScroll() {
  stopScroll()
  if (bodyRef.value) bodyRef.value.scrollTop = 0
  if (!autoScroll.value || dataRows.value.length === 0) return
  scrollTimer = window.setInterval(() => {
    if (isPaused) return
    const body = bodyRef.value
    if (!body) return
    body.scrollTop += step.value * rowHeight.value
    // 超过一份完整数据高度时重置为 0，实现无缝循环
    const halfHeight = dataRows.value.length * rowHeight.value
    if (body.scrollTop >= halfHeight) {
      body.scrollTop = 0
    }
  }, interval.value)
}

function stopScroll() {
  if (scrollTimer !== null) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
}

function onBodyEnter() {
  if (pauseOnHover.value) isPaused = true
}

function onBodyLeave() {
  isPaused = false
}

onMounted(() => {
  startScroll()
})

onUnmounted(() => {
  stopScroll()
})

watch(
  [autoScroll, interval, step, dataRows, rowHeight],
  () => {
    startScroll()
  },
)
</script>

<style scoped lang="less">
.widget-scroll-table {
  width: 100%;
  height: 100%;
  user-select: none;

  .st-cell {
    box-sizing: border-box;
  }

  .st-header {
    .st-cell {
      box-sizing: border-box;
    }
  }

  .st-body {
    flex: 1 1 auto;
    overflow: hidden;
    position: relative;
  }

  .st-row {
    background-color: var(--st-bg);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--st-hover-bg);
    }
  }

  .st-empty {
    color: #9ca3af;
    font-size: 14px;
    text-align: center;
    padding: 16px;
  }
}
</style>

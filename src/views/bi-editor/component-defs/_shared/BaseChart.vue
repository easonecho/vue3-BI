<template>
  <div class="base-chart-wrap">
    <div ref="chartRef" class="base-chart" :style="{ width: '100%', height: '100%' }" />
    <div v-if="detailAvailable || chipText" class="chart-actions" @mousedown.stop @click.stop>
      <button
        v-if="detailAvailable"
        class="chart-action-btn"
        type="button"
        :title="t('editorMaterial.ui.viewRawDetail')"
        @click="openDetail"
      >
        {{ t('editorMaterial.ui.detail') }}
      </button>
      <transition name="chart-chip-fade">
        <div v-if="chipText" class="chart-chip">
          <span class="chart-chip__text">{{ chipText }}</span>
          <button class="chart-chip__btn" type="button" @click.stop="handleChipAction">
            {{ isDrilling ? t('editorMaterial.ui.back') : '×' }}
          </button>
        </div>
      </transition>
    </div>
    <ChartDetailDrawer
      v-model:visible="detailVisible"
      :dataset-id="detailDatasetId"
      :filters="detailFilters"
      :title="detailTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef, computed, watch, type ShallowRef } from 'vue'
import { init, type ECharts, type ECOption } from './echarts-config'
import { useLinkageStore } from '@/stores/linkage'
import {
  buildDetailFilters,
  resolveChartClickIntent,
} from '@/views/bi-editor/composables/drill-through'
import { resolveLinkField, type LinkFieldMap } from '@/views/bi-editor/composables/linkage-filter'
import ChartDetailDrawer from './ChartDetailDrawer.vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ comp: ComponentInstance }>()

const linkageStore = useLinkageStore()

const chartRef = ref<HTMLDivElement | null>(null)
const chartInstance: ShallowRef<ECharts | null> = shallowRef(null)
let resizeObserver: ResizeObserver | null = null

// ========== 🔑 图表联动 / 钻取 ==========
const compId = computed(() => String(props.comp.id))
const dataConfig = computed(() => (props.comp.dataConfig ?? {}) as Record<string, unknown>)

function pickField(key: string): string {
  const value = dataConfig.value[key]
  return typeof value === 'string' ? value : ''
}

/** 维度字段：不同图表命名不同，按优先级取第一个已配置字段 */
const dimensionField = computed(
  () =>
    pickField('categoryField') ||
    pickField('nameField') ||
    pickField('xField') ||
    pickField('labelField') ||
    pickField('dateField') ||
    pickField('treeField'),
)

const drillFields = computed<string[]>(() => {
  const value = dataConfig.value.drillFields
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && !!item)
    : []
})

/** 点击行为: auto=联动/下钻, detail=打开明细 */
const clickAction = computed(() => {
  const value = props.comp.props?.clickAction
  return typeof value === 'string' ? value : 'auto'
})

/** 联动字段映射: 源图表字段名 → 当前图表字段名（跨数据集联动） */
const linkFieldMap = computed<LinkFieldMap | undefined>(() => {
  const map = props.comp.props?.linkFieldMap
  return map && typeof map === 'object' ? (map as LinkFieldMap) : undefined
})

const drillStack = computed(() => {
  void linkageStore.drillStates
  return linkageStore.getDrillStack(compId.value)
})

/** 当前生效维度：钻取后自动切到下一层字段 */
const effectiveDimensionField = computed(() =>
  linkageStore.getDrillField(compId.value, drillFields.value, dimensionField.value),
)

/** 其他图表联动到当前图表所配置字段时，展示可清除的筛选提示 */
const appliedLinkFilter = computed(() => {
  const fields = new Set(
    [
      'categoryField',
      'nameField',
      'xField',
      'yField',
      'labelField',
      'dateField',
      'treeField',
      'seriesField',
    ]
      .map(pickField)
      .filter(Boolean),
  )
  return linkageStore.linkFilters.find((f) => {
    if (f.sourceId === compId.value) return false
    return fields.has(resolveLinkField(f, linkFieldMap.value))
  })
})

const isDrilling = computed(() => drillStack.value.length > 0)

const chipText = computed(() => {
  if (isDrilling.value) {
    return `${t('editorMaterial.ui.drillPrefix')}: ${drillStack.value.map((item) => item.value).join(' / ')}`
  }
  if (appliedLinkFilter.value) {
    return `${t('editorMaterial.ui.linkPrefix')}: ${resolveLinkField(appliedLinkFilter.value, linkFieldMap.value)} = ${appliedLinkFilter.value.value}`
  }
  return ''
})

function handleChipAction() {
  if (isDrilling.value) {
    linkageStore.popDrill(compId.value)
    return
  }
  const filter = appliedLinkFilter.value
  if (filter) linkageStore.clearLinkFiltersBySource(filter.sourceId)
}

// ========== 🔑 明细钻取 (drill-through) ==========
/** 图表绑定数据集时才提供明细入口 */
const detailDatasetId = computed(() => {
  const id = Number(props.comp.dataSource?.datasetId ?? 0)
  return Number.isFinite(id) && id > 0 ? id : null
})
const detailAvailable = computed(() => detailDatasetId.value !== null)
const detailVisible = ref(false)
/** 点击图形元素时的维度值，作为明细的额外等值过滤 */
const clickedDetail = ref<{ field: string; value: string } | null>(null)

/**
 * 明细查询沿用全局筛选 / 钻取 / 全部联动筛选 + 点击项维度值。
 * 注意与图表自身查询不同：这里不能排除当前组件作为源的联动，
 * 否则点击柱子产生的筛选不会体现在明细中。
 */
const detailFilters = computed(() =>
  buildDetailFilters({
    globalFilters: linkageStore.filterValues,
    linkFilters: linkageStore.linkFilters,
    drillFilters: linkageStore.getDrillStack(compId.value),
    linkFieldMap: linkFieldMap.value,
    field: clickedDetail.value?.field,
    value: clickedDetail.value?.value,
  }),
)

const detailTitle = computed(() =>
  clickedDetail.value ? `${props.comp.name} · ${clickedDetail.value.value}` : props.comp.name,
)

function openDetail() {
  if (!detailAvailable.value) return
  clickedDetail.value = null
  detailVisible.value = true
}

// 关闭抽屉后清除点击过滤，避免下次通过「明细」按钮打开时残留
watch(detailVisible, (visible) => {
  if (!visible) clickedDetail.value = null
})

/** ECharts 点击回调的最小参数集 */
interface ChartClickParams {
  componentType?: string
  name?: unknown
}

/** ECharts 数据项点击：按配置打开明细 / 逐层下钻 / 联动其他图表 */
function handleChartClick(params?: ChartClickParams) {
  if (!linkageStore.linkageEnabled) return
  if (!params || params.componentType !== 'series') return
  const intent = resolveChartClickIntent({
    clickAction: clickAction.value,
    field: effectiveDimensionField.value,
    value: params.name,
    drillFields: drillFields.value,
    drillDepth: drillStack.value.length,
  })
  if (intent.type === 'none') return
  if (intent.type === 'detail') {
    clickedDetail.value = { field: intent.field, value: intent.value }
    detailVisible.value = true
    return
  }
  if (intent.type === 'drill') {
    linkageStore.pushDrill(compId.value, intent.field, intent.value)
    return
  }
  linkageStore.toggleLinkFilter({
    sourceId: compId.value,
    sourceName: props.comp.name,
    field: intent.field,
    value: intent.value,
  })
}

function bindChartEvents(inst: ECharts) {
  inst.off('click')
  inst.on('click', handleChartClick)
}
/** 🔑 按需初始化：IntersectionObserver 监听可见性，可见时才 init ECharts */
let intersectionObserver: IntersectionObserver | null = null
/** 🔑 防止 IO 回调重复调度 init */
let initScheduled = false
/** 🔑 离屏 dispose 防抖：不可见后延迟 500ms 才 dispose，避免频繁滚动时 init/dispose 抖动 */
let disposeTimer: number | null = null
/** 🔑 容器尺寸就绪重试计数：dispose 后重新 init 时重置 */
let retryCount = 0

/** 🔑 待应用的 option：如果 setOption 在 chart 初始化完成前被调用，先缓存，
 *   等 initChart 完成后立即应用，避免首次渲染丢失导致无入场动画。 */
let pendingOption: ECOption | null = null
/** 🔑 标记是否已完成首次 setOption（用于区分首次 vs 后续，决定是否启用 lazyUpdate） */
let firstOptionApplied = false

function initChart() {
  if (!chartRef.value) return
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  chartInstance.value = init(chartRef.value)
  bindChartEvents(chartInstance.value)
  // 🔑 重新 init 后重置 firstOptionApplied，让首次 setOption 走同步路径触发入场动画
  firstOptionApplied = false
  // 🔑 初始化完成后立即应用待处理的 option，触发首次入场动画
  if (pendingOption) {
    const opt = pendingOption
    pendingOption = null
    chartInstance.value.setOption(opt)
    firstOptionApplied = true
  }
}

/** 🔑 RAF 防抖 resize：拉伸组件时 ResizeObserver 高频触发（每帧 1 次），
 *   每次都同步调 chart.resize() 会触发 ECharts 完整 resize 流程 + 布局抖动。
 *   用 RAF 合并同一帧内的多次回调为一次 resize 调用。 */
let resizeRafId: number | null = null
function handleResize() {
  if (resizeRafId !== null) return
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null
    chartInstance.value?.resize()
  })
}

/** 🔑 容器尺寸就绪后 init ECharts + 绑定 ResizeObserver */
function tryInit() {
  const dom = chartRef.value
  if (!dom) return
  if (dom.offsetWidth === 0 || dom.offsetHeight === 0) {
    if (retryCount++ < 10) {
      requestAnimationFrame(tryInit)
    }
    return
  }
  initChart()
  resizeObserver = new ResizeObserver(() => handleResize())
  resizeObserver.observe(dom)
}

onMounted(() => {
  // 🔑 按需初始化 + 离屏 dispose：IntersectionObserver 双向监听可见性。
  //   可见 → init ECharts（配合 requestIdleCallback 分批，避免首屏同时 init 阻塞）。
  //   不可见 → 延迟 500ms dispose（释放 ECharts 实例 + WebGL context，减少内存占用）。
  //   rootMargin: 200px 缓冲区，防止滚动边缘组件频繁 init/dispose。
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // 🔑 可见：取消 pending dispose，init if needed
          if (disposeTimer !== null) {
            clearTimeout(disposeTimer)
            disposeTimer = null
          }
          if (!chartInstance.value && !initScheduled) {
            initScheduled = true
            const run = () => {
              initScheduled = false
              tryInit()
            }
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(run, { timeout: 300 })
            } else {
              setTimeout(run, 16)
            }
          }
        } else {
          // 🔑 不可见：延迟 dispose（500ms 防抖，避免频繁滚动时 init/dispose 抖动）
          //   dispose 释放 ECharts 实例 + WebGL context，减少内存占用
          if (chartInstance.value && disposeTimer === null) {
            disposeTimer = window.setTimeout(() => {
              disposeTimer = null
              chartInstance.value?.dispose()
              chartInstance.value = null
              resizeObserver?.disconnect()
              resizeObserver = null
              // 重置重试计数，下次 init 时从 0 开始
              retryCount = 0
            }, 500)
          }
        }
      }
    },
    { threshold: 0.01, rootMargin: '200px' },
  )
  if (chartRef.value) intersectionObserver.observe(chartRef.value)
})

onBeforeUnmount(() => {
  if (disposeTimer !== null) {
    clearTimeout(disposeTimer)
    disposeTimer = null
  }
  // 🔑 取消 pending RAF，避免组件卸载后回调访问已 dispose 的实例
  if (resizeRafId !== null) {
    cancelAnimationFrame(resizeRafId)
    resizeRafId = null
  }
  intersectionObserver?.disconnect()
  intersectionObserver = null
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance.value?.dispose()
  chartInstance.value = null
})

// 🔑 性能优化：移除冗余的尺寸 watch。
//   ResizeObserver 已监听容器 DOM 尺寸变化并调用 handleResize()，
//   watch(() => `${width}_${height}`) 会在 comp 尺寸变更时同步再触发一次 handleResize()，
//   导致每次 resize 产生 2 次 chart.resize() 调用。
//   ResizeObserver 在浏览器布局完成后异步触发，是更正确的 resize 时机。

/** 🔑 数组类组件的 replaceMerge 列表（只放真正"会被当成数组、且有从有→无/从多→少切换场景"的组件）。
 *   ❌ 严禁把 grid / title / tooltip / toolbox / brush / visualMap 等单对象类组件
 *        或 dataset 这类不会被用户"从数组变空"的组件列入，否则 replaceMerge 会把
 *        这些字段下本来完整的配置整组销毁，导致图表不渲染、dataZoom 无法挂载、
 *        交互层崩溃等怪异问题。
 *   ✅ 只保留：
 *     - dataZoom：会从 inside+slider（2个元素）切到 []（空数组），关不掉问题的核心
 *     - xAxis / yAxis：双轴图表时是数组，单轴时可能从对象变数组
 *     - series：切换图表类型时数组项会完全重写
 *     - legend：在分页 / 自定义 / 关闭场景下会从数组 → 空对象或单对象，需整体替换
 */
const REPLACE_MERGE_KEYS: string[] = ['dataZoom', 'series', 'xAxis', 'yAxis', 'legend']

/** 供子类获取 chart 实例 */
defineExpose({
  getChart: () => chartInstance.value,
  setOption: (option: ECOption) => {
    const inst = chartInstance.value
    if (!inst) {
      // 🔑 chart 未初始化完成时缓存 option，initChart 完成后会自动应用
      pendingOption = option
      return
    }
    // 🔑 首次 setOption：同步执行，触发入场动画（首次无旧实例残留，不需要 replaceMerge）
    //   后续 setOption：启用 lazyUpdate + replaceMerge，
    //   让 ECharts 在下一帧批量处理，并且数组类组件整体替换，避免旧配置残留。
    if (!firstOptionApplied) {
      firstOptionApplied = true
      inst.setOption(option)
    } else {
      inst.setOption(option, {
        lazyUpdate: true,
        replaceMerge: REPLACE_MERGE_KEYS,
      })
    }
    // 容器尺寸为 0 时强制 resize：处理初始化时容器未布局完的情况
    const dom = chartRef.value
    if (dom && (dom.offsetWidth === 0 || dom.offsetHeight === 0)) {
      inst.resize()
    }
  },
  resize: handleResize,
})
</script>

<style scoped lang="less">
.base-chart-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.base-chart {
  width: 100%;
  height: 100%;
}

/* 右上角操作区：明细按钮 + 联动/钻取提示 chip，不遮挡图表主体 */
.chart-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 12px);
}

/* 明细入口：默认半透明，悬停时高亮 */
.chart-action-btn {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(17, 24, 39, 0.68);
  color: #e5e7eb;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  opacity: 0.72;
  transition:
    opacity 0.18s ease,
    background 0.18s ease;

  &:hover {
    opacity: 1;
    background: rgba(17, 24, 39, 0.9);
  }
}

/* 联动 / 钻取提示 chip */
.chart-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: 12px;
  line-height: 18px;
  color: #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);

  &__text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__btn {
    flex: 0 0 auto;
    padding: 0 4px;
    border: none;
    background: transparent;
    color: #93c5fd;
    font-size: 12px;
    line-height: 18px;
    cursor: pointer;

    &:hover {
      color: #bfdbfe;
      text-decoration: underline;
    }
  }
}

.chart-chip-fade-enter-active,
.chart-chip-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.chart-chip-fade-enter-from,
.chart-chip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="960px"
    top="6vh"
    destroy-on-close
    @opened="renderChart"
    @closed="disposeChart"
  >
    <div class="lineage-toolbar">
      <el-input
        v-model="keyword"
        :placeholder="t('datasetPage.lineage.searchPlaceholder')"
        clearable
        style="width: 260px"
        :prefix-icon="Search"
        @keyup.enter="reload"
        @clear="reload"
      />
      <el-button :loading="loading" @click="reload">{{ t('datasetPage.query') }}</el-button>
      <!-- 聚焦入口 (数据集页/看板页) -->
      <el-tag v-if="focusLabel && !scopeCleared" type="warning" effect="plain" size="small">
        {{ t('datasetPage.lineage.focusOnly', { label: focusLabel }) }}
      </el-tag>
      <el-button v-if="focusLabel && !scopeCleared" link type="primary" @click="showFullGraph">
        {{ t('datasetPage.lineage.showAll') }}
      </el-button>
      <div v-if="stats" class="lineage-stats">
        <el-tag size="small" effect="plain" type="info">{{
          t('datasetPage.lineage.statDatasource', { count: stats.datasourceCount })
        }}</el-tag>
        <el-tag size="small" effect="plain" type="primary">{{
          t('datasetPage.lineage.statDataset', { count: stats.datasetCount })
        }}</el-tag>
        <el-tag size="small" effect="plain" type="success">{{
          t('datasetPage.lineage.statDashboard', { count: stats.dashboardCount })
        }}</el-tag>
        <el-tag size="small" effect="plain">{{
          t('datasetPage.lineage.statEdge', { count: stats.edgeCount })
        }}</el-tag>
      </div>
    </div>

    <div v-loading="loading" class="lineage-canvas-wrap">
      <div ref="chartEl" class="lineage-chart" />
      <el-empty
        v-if="!loading && nodes.length === 0"
        :description="emptyDescription"
        :image-size="70"
        class="lineage-empty"
      />
    </div>

    <template #footer>
      <span class="lineage-hint">{{ t('datasetPage.lineage.hint') }}</span>
      <el-button @click="visible = false">{{ t('common.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import { init as echartsInit, use, type ECharts } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getLineage, type LineageEdge, type LineageNode, type LineageStats } from '@/api/lineage'

// 🔑 ECharts 按需注册（模块级执行一次）：关系图 + 图例/提示框 + Canvas 渲染器
use([GraphChart, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  modelValue: boolean
  /** 弹窗标题 (默认「数据血缘」) */
  title?: string
  /** 聚焦数据集 (数据集页入口) */
  datasetId?: number
  /** 聚焦看板 (看板页入口) */
  dashboardId?: number
}>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const keyword = ref('')
const loading = ref(false)
/** 聚焦模式下是否已切换为全量图 */
const scopeCleared = ref(false)
const nodes = ref<LineageNode[]>([])
const edges = ref<LineageEdge[]>([])
const stats = ref<LineageStats | null>(null)

const dialogTitle = computed(() => props.title || t('datasetPage.lineage.title'))

/** 当前聚焦对象文案 (为空表示全量图) */
const focusLabel = computed(() => {
  if (props.datasetId) return t('datasetPage.lineage.focusDataset')
  if (props.dashboardId) return t('datasetPage.lineage.focusDashboard')
  return ''
})

const emptyDescription = computed(() =>
  focusLabel.value && !scopeCleared.value
    ? t('datasetPage.lineage.emptyFocused', { label: focusLabel.value })
    : t('datasetPage.lineage.empty'),
)

function showFullGraph() {
  scopeCleared.value = true
  reload()
}

const chartEl = ref<HTMLDivElement>()
let chart: ECharts | null = null

const KIND_INDEX: Record<LineageNode['kind'], number> = {
  datasource: 0,
  dataset: 1,
  dashboard: 2,
}

const CATEGORY_STYLE = computed(() => [
  { name: t('datasetPage.lineage.kindDatasource'), itemStyle: { color: '#909399' } },
  { name: t('datasetPage.lineage.kindDataset'), itemStyle: { color: '#5470c6' } },
  { name: t('datasetPage.lineage.kindDashboard'), itemStyle: { color: '#3ba272' } },
])

function ensureChart(): ECharts | null {
  if (!chartEl.value) return null
  if (!chart) chart = echartsInit(chartEl.value)
  return chart
}

function renderChart() {
  nextTick(() => {
    const instance = ensureChart()
    if (!instance) return
    instance.resize()

    if (nodes.value.length === 0) {
      instance.clear()
      return
    }

    instance.setOption(
      {
        tooltip: {
          formatter: (params: any) => {
            if (params.dataType === 'edge') {
              return `${edgeLabel(params.data)}`
            }
            const node = params.data as LineageNode
            return `<b>${node.name}</b><br/>${kindLabel(node.kind)}${node.meta ? ` · ${node.meta}` : ''}`
          },
        },
        legend: [
          {
            data: CATEGORY_STYLE.value.map((item) => item.name),
            bottom: 0,
            icon: 'circle',
            textStyle: { color: '#6b7280', fontSize: 12 },
          },
        ],
        series: [
          {
            type: 'graph',
            layout: 'force',
            roam: true,
            draggable: true,
            symbol: 'circle',
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: 8,
            force: { repulsion: 360, edgeLength: [90, 170], gravity: 0.08 },
            categories: CATEGORY_STYLE.value,
            label: {
              show: true,
              position: 'right',
              fontSize: 12,
              color: '#374151',
              formatter: (p: any) => p.data?.name ?? '',
            },
            lineStyle: { color: 'source', curveness: 0.08, width: 1.4, opacity: 0.7 },
            emphasis: { focus: 'adjacency', lineStyle: { width: 2.4 } },
            data: nodes.value.map((n) => ({
              id: n.id,
              name: n.name,
              category: KIND_INDEX[n.kind],
              value: n.meta,
              symbolSize: n.kind === 'dashboard' ? 54 : n.kind === 'dataset' ? 42 : 34,
            })),
            links: edges.value.map((e) => ({
              source: e.source,
              target: e.target,
              value: e.label ?? '',
              label: {
                show: !!e.label,
                formatter: e.label ?? '',
                fontSize: 10,
                color: '#9ca3af',
              },
            })),
          },
        ],
      },
      true,
    )
  })
}

function edgeLabel(data: any): string {
  const label = typeof data?.value === 'string' ? data.value : ''
  return label
    ? t('datasetPage.lineage.edgeComponent', { label })
    : t('datasetPage.lineage.edgeDefault')
}

function kindLabel(kind: LineageNode['kind']): string {
  return kind === 'datasource'
    ? t('datasetPage.lineage.kindDatasource')
    : kind === 'dataset'
      ? t('datasetPage.lineage.kindDataset')
      : t('datasetPage.lineage.kindDashboard')
}

async function reload() {
  loading.value = true
  try {
    const focused = focusLabel.value && !scopeCleared.value
    const res = await getLineage({
      keyword: keyword.value,
      datasetId: focused ? props.datasetId : undefined,
      dashboardId: focused ? props.dashboardId : undefined,
    })
    nodes.value = res.data.nodes
    edges.value = res.data.edges
    stats.value = res.data.stats
    renderChart()
  } catch {
    nodes.value = []
    edges.value = []
    stats.value = null
    renderChart()
  } finally {
    loading.value = false
  }
}

function disposeChart() {
  chart?.dispose()
  chart = null
}

function handleResize() {
  chart?.resize()
}

window.addEventListener('resize', handleResize)
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  disposeChart()
})

// 打开弹窗时加载数据 (dialog destroy-on-close, 每次打开都重新拉取)
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      keyword.value = ''
      scopeCleared.value = false
      reload()
    }
  },
)
</script>

<style scoped lang="less">
.lineage-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.lineage-stats {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.lineage-canvas-wrap {
  position: relative;
  height: 520px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fcfcfd;
  overflow: hidden;
}
.lineage-chart {
  width: 100%;
  height: 100%;
}
.lineage-empty {
  position: absolute;
  inset: 0;
  background: #fcfcfd;
}
.lineage-hint {
  float: left;
  color: #9ca3af;
  font-size: 12px;
  line-height: 32px;
}
</style>

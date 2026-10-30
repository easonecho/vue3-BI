<template>
  <el-dialog
    v-model="visible"
    title="数据血缘"
    width="960px"
    top="6vh"
    destroy-on-close
    @opened="renderChart"
    @closed="disposeChart"
  >
    <div class="lineage-toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索数据源 / 数据集 / 看板"
        clearable
        style="width: 260px"
        :prefix-icon="Search"
        @keyup.enter="reload"
        @clear="reload"
      />
      <el-button :loading="loading" @click="reload">查询</el-button>
      <div v-if="stats" class="lineage-stats">
        <el-tag size="small" effect="plain" type="info">数据源 {{ stats.datasourceCount }}</el-tag>
        <el-tag size="small" effect="plain" type="primary">数据集 {{ stats.datasetCount }}</el-tag>
        <el-tag size="small" effect="plain" type="success">看板 {{ stats.dashboardCount }}</el-tag>
        <el-tag size="small" effect="plain">关系 {{ stats.edgeCount }}</el-tag>
      </div>
    </div>

    <div v-loading="loading" class="lineage-canvas-wrap">
      <div ref="chartEl" class="lineage-chart" />
      <el-empty
        v-if="!loading && nodes.length === 0"
        description="暂无血缘数据 (看板组件绑定数据集后自动生成)"
        :image-size="70"
        class="lineage-empty"
      />
    </div>

    <template #footer>
      <span class="lineage-hint">拖拽节点或滚轮缩放查看; 箭头方向: 数据源 → 数据集 → 看板</span>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getLineage, type LineageEdge, type LineageNode, type LineageStats } from '@/api/lineage'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const keyword = ref('')
const loading = ref(false)
const nodes = ref<LineageNode[]>([])
const edges = ref<LineageEdge[]>([])
const stats = ref<LineageStats | null>(null)

const chartEl = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

const KIND_INDEX: Record<LineageNode['kind'], number> = {
  datasource: 0,
  dataset: 1,
  dashboard: 2,
}

const CATEGORY_STYLE = [
  { name: '数据源', itemStyle: { color: '#909399' } },
  { name: '数据集', itemStyle: { color: '#5470c6' } },
  { name: '看板', itemStyle: { color: '#3ba272' } },
]

function ensureChart(): echarts.ECharts | null {
  if (!chartEl.value) return null
  if (!chart) chart = echarts.init(chartEl.value)
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
            data: ['数据源', '数据集', '看板'],
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
            categories: CATEGORY_STYLE,
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
  return label ? `组件: ${label}` : '数据流向'
}

function kindLabel(kind: LineageNode['kind']): string {
  return kind === 'datasource' ? '数据源' : kind === 'dataset' ? '数据集' : '看板'
}

async function reload() {
  loading.value = true
  try {
    const res = await getLineage(keyword.value.trim() || undefined)
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

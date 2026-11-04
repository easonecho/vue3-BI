import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getProcessMemory,
  getRuntimeMetrics,
  getSystemStats,
  type MetricsSnapshot,
  type ProcessMemory,
  type SystemStats,
} from '@/api/monitor'
import { getDashboardDetail, getDashboardList } from '@/api/dashboard'
import {
  executeDataset,
  queryDataset,
  type AggregateFn,
} from '@/api/dataset'
import { pad } from '../utils/screen-utils'
import type { CategorySeriesData, PieDatum } from '../utils/screen-chart-options'
import {
  DEMO_RANKING,
  DEMO_RATES,
  buildCategorySeries,
  buildLegacyCategorySeries,
  buildLegacyPieData,
  buildPieData,
  buildRankingFromDashboards,
  buildRankingFromSeries,
  buildRatesFromSystem,
  extractLayoutDatasetId,
  findBarConfig,
  findLineConfig,
  findPieConfig,
  parseLayoutChartConfigs,
  readString,
  readStringArray,
  type KpiItem,
  type RankingItem,
  type RateItem,
  type ScreenChartConfig,
} from '../utils/screen-data'

const DEMO_KPIS: KpiItem[] = [
  { label: '总销售额', value: '¥ 3,284,195', unit: '', color: '#00eaff' },
  { label: '订单数', value: '12,486', unit: ' 单', color: '#4ade80' },
  { label: '活跃用户', value: '48,320', unit: ' 人', color: '#f7c365' },
  { label: '转化率', value: '5.68', unit: '%', color: '#f87171' },
  { label: '客单价', value: '263', unit: '¥', color: '#c084fc' },
]

const AGGREGATE_FNS = new Set<AggregateFn>([
  'sum',
  'avg',
  'count',
  'countDistinct',
  'max',
  'min',
])
const TOP_N_MAX = 500
const RAW_ROW_LIMIT = 5000
const AGGREGATE_ROW_LIMIT = 2000

/**
 * 🔑 大屏会话：系统统计 KPI、运行指标、真实图表数据、时钟与全屏。
 *   图表渲染由 useScreenCharts 负责；本 composable 只负责取数与数据映射。
 */
export function useScreenDashboard() {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const errorMsg = ref('')
  const stats = ref<SystemStats | null>(null)
  const memory = ref<ProcessMemory | null>(null)
  const metrics = ref<MetricsSnapshot | null>(null)
  const dashboardStats = ref<{ total: number; withCharts: number } | null>(null)

  const screenTitle = ref('企业运营数据驾驶舱')
  const pieChartTitle = ref('业务构成')
  const midChartTitle = ref('全国销售大屏')
  const lineChartTitle = ref('流量趋势')

  // 图表真实数据（为空时由图表 option 构造器回退演示数据）
  const pieData = ref<PieDatum[]>([])
  const barData = ref<CategorySeriesData | null>(null)
  const lineData = ref<CategorySeriesData | null>(null)
  const barRanking = ref<RankingItem[]>([])
  const dashboardRanking = ref<RankingItem[]>([])

  const fullscreen = ref(false)
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
    fullscreen.value = !!document.fullscreenElement
  }
  function back() {
    router.push('/dashboard')
  }

  const nowText = ref('')
  let clockTimer: number | undefined
  let statsTimer: number | undefined
  function tickClock() {
    const d = new Date()
    nowText.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  /** 顶部 KPI：优先 monitor/stats 真实数据，接口失败才回退演示数据 */
  const kpis = computed<KpiItem[]>(() => {
    const s = stats.value
    if (s) {
      return [
        { label: '用户总数', value: String(s.users), unit: ' 人', color: '#00eaff' },
        { label: '仪表板数', value: String(s.dashboards), unit: '', color: '#4ade80' },
        { label: '数据集数', value: String(s.datasets), unit: '', color: '#f7c365' },
        { label: '在线用户', value: String(s.onlineUsers), unit: ' 人', color: '#f87171' },
        { label: '数据源数', value: String(s.datasources), unit: '', color: '#c084fc' },
      ]
    }
    return DEMO_KPIS
  })

  /** 运行指标：全部来自真实接口；一项都没有时才回退演示数据 */
  const rates = computed<RateItem[]>(() => {
    const items = buildRatesFromSystem({
      metrics: metrics.value,
      stats: stats.value,
      // /monitor/memory 失败时，运行指标快照里也带有内存数据
      memory: memory.value ?? metrics.value?.memoryMb ?? null,
      dashboards: dashboardStats.value,
    })
    return items.length > 0 ? items : DEMO_RATES
  })

  /** 榜单：优先柱状图真实数据，其次看板图表数，最后演示数据 */
  const ranking = computed<RankingItem[]>(() => {
    if (barRanking.value.length > 0) return barRanking.value
    if (dashboardRanking.value.length > 0) return dashboardRanking.value
    return DEMO_RANKING
  })

  async function loadStats() {
    try {
      const res = await getSystemStats()
      stats.value = res.data
    } catch {
      // 静默失败，使用 fallback demo 数据
    }
  }

  async function loadRuntime() {
    await Promise.allSettled([
      getRuntimeMetrics()
        .then((res) => {
          metrics.value = res.data
        })
        .catch(() => undefined),
      getProcessMemory()
        .then((res) => {
          memory.value = res.data
        })
        .catch(() => undefined),
    ])
  }

  /** 看板列表：用于「看板出图率」与图表数榜单兜底 */
  async function loadDashboardRanking() {
    try {
      const res = await getDashboardList({ page: 1, pageSize: 100 })
      const list = res.data.list ?? []
      const withCharts = list.filter((item) => Number(item._count?.charts ?? 0) > 0).length
      dashboardStats.value = { total: res.data.total, withCharts }
      dashboardRanking.value = buildRankingFromDashboards(list)
    } catch {
      // 列表接口失败：不影响大屏主体
    }
  }

  /** 解析图表聚合配置：缺省 sum；显式 none 表示不聚合 */
  function resolveAggregate(config: ScreenChartConfig): AggregateFn | 'none' {
    const raw = readString(config.props.aggregate) ?? 'sum'
    if (raw === 'none') return 'none'
    return AGGREGATE_FNS.has(raw as AggregateFn) ? (raw as AggregateFn) : 'sum'
  }

  function resolveTopN(config: ScreenChartConfig): number {
    const value = Number(config.props.topN)
    if (!Number.isFinite(value) || value <= 0) return 0
    return Math.min(TOP_N_MAX, Math.floor(value))
  }

  /**
   * 取图表数据：
   *   - 聚合模式走服务端 GROUP BY（与编辑器内的图表逻辑一致）
   *   - Top-N 模式按第一个度量排序并 LIMIT
   *   - 非聚合模式拉取原始行，前端映射字段
   */
  async function fetchChartRows(
    config: ScreenChartConfig,
    categoryField: string,
    valueFields: string[],
  ): Promise<Record<string, unknown>[]> {
    const aggregate = resolveAggregate(config)
    if (aggregate !== 'none') {
      const topN = resolveTopN(config)
      const direction =
        readString(config.props.topNDirection) === 'asc' ? ('asc' as const) : ('desc' as const)
      const res = await queryDataset(config.datasetId, {
        groupBy: [categoryField],
        metrics: valueFields.map((field) => ({ field, aggregate, alias: field })),
        orderBy:
          topN > 0
            ? { field: valueFields[0], direction }
            : { field: categoryField, direction: 'asc' },
        limit: topN > 0 ? topN : AGGREGATE_ROW_LIMIT,
      })
      return res.data.rows ?? []
    }

    const res = await executeDataset(config.datasetId, { limit: RAW_ROW_LIMIT })
    return res.data.rows ?? []
  }

  async function loadPieChart(config: ScreenChartConfig | null) {
    if (!config) return
    const nameField = readString(config.dataConfig.nameField)
    const valueField = readString(config.dataConfig.valueField)
    if (!nameField || !valueField) return
    const rows = await fetchChartRows(config, nameField, [valueField])
    pieData.value = buildPieData(rows, nameField, valueField)
  }

  async function loadCategoryChart(
    config: ScreenChartConfig | null,
  ): Promise<CategorySeriesData | null> {
    if (!config) return null
    const categoryField = readString(config.dataConfig.categoryField)
    const valueFields = readStringArray(config.dataConfig.valueFields)
    if (!categoryField || valueFields.length === 0) return null
    const rows = await fetchChartRows(config, categoryField, valueFields)
    return buildCategorySeries(rows, categoryField, valueFields)
  }

  async function loadBarChart(config: ScreenChartConfig | null) {
    const data = await loadCategoryChart(config)
    if (!data) return
    barData.value = data
    barRanking.value = buildRankingFromSeries(data)
  }

  async function loadLineChart(config: ScreenChartConfig | null) {
    const data = await loadCategoryChart(config)
    if (data) lineData.value = data
  }

  /** 旧布局兜底：只有顶层 datasetId、没有图表组件配置时使用 */
  async function loadLegacyData(datasetId: number) {
    const res = await executeDataset(datasetId, { limit: 100 })
    const rows = res.data.rows ?? []
    if (rows.length === 0) return

    const pie = buildLegacyPieData(rows)
    if (pie.length > 0 && pieData.value.length === 0) pieData.value = pie

    const series = buildLegacyCategorySeries(rows)
    if (!series) return
    if (!barData.value) {
      barData.value = series
      barRanking.value = buildRankingFromSeries(series)
    }
    if (!lineData.value) lineData.value = series
  }

  /** 加载 dashboard 的真实图表数据；失败不阻断大屏渲染 */
  async function loadDashboard() {
    const id = route.params.id
    if (!id) return

    try {
      const res = await getDashboardDetail(Number(id))
      const dashboard = res.data
      if (dashboard?.name) screenTitle.value = dashboard.name

      const layout = dashboard?.layout
      const configs = parseLayoutChartConfigs(layout)
      const pieConfig = findPieConfig(configs)
      const barConfig = findBarConfig(configs)
      const lineConfig = findLineConfig(configs)

      const pieTitle = pieConfig ? readString(pieConfig.props.titleText) : null
      if (pieTitle) pieChartTitle.value = pieTitle
      const barTitle = barConfig ? readString(barConfig.props.titleText) : null
      if (barTitle) midChartTitle.value = barTitle
      const lineTitle = lineConfig ? readString(lineConfig.props.titleText) : null
      if (lineTitle) lineChartTitle.value = lineTitle

      await Promise.allSettled([
        loadPieChart(pieConfig),
        loadBarChart(barConfig),
        loadLineChart(lineConfig),
      ])

      // 没有任何图表配置时，兼容旧布局的顶层 datasetId
      if (!pieConfig && !barConfig && !lineConfig) {
        const legacyId = extractLayoutDatasetId(layout)
        if (legacyId) await loadLegacyData(legacyId)
      }
    } catch {
      // dashboard 加载失败：保留演示数据，不阻断整个大屏
    }
  }

  /** 启动页面：时钟、数据加载、30 秒统计轮询（由页面 mounted 时调用） */
  async function init() {
    loading.value = true
    tickClock()
    clockTimer = window.setInterval(tickClock, 1000)

    await Promise.allSettled([loadStats(), loadRuntime(), loadDashboard(), loadDashboardRanking()])

    loading.value = false

    statsTimer = window.setInterval(() => {
      void loadStats()
      void loadRuntime()
    }, 30000)
  }

  function stop() {
    if (clockTimer) clearInterval(clockTimer)
    if (statsTimer) clearInterval(statsTimer)
  }

  return {
    loading,
    errorMsg,
    screenTitle,
    pieChartTitle,
    midChartTitle,
    lineChartTitle,
    fullscreen,
    toggleFullscreen,
    back,
    nowText,
    kpis,
    rates,
    ranking,
    pieData,
    barData,
    lineData,
    init,
    stop,
  }
}

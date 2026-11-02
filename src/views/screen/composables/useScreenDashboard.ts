import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSystemStats, type SystemStats } from '@/api/monitor'
import { getDashboardDetail } from '@/api/dashboard'
import { executeDataset } from '@/api/dataset'
import { pad } from '../utils/screen-utils'
import type { PieDatum } from '../utils/screen-chart-options'

export interface KpiItem {
  label: string
  value: string
  unit: string
  color: string
}

const DEMO_KPIS: KpiItem[] = [
  { label: '总销售额', value: '¥ 3,284,195', unit: '', color: '#00eaff' },
  { label: '订单数', value: '12,486', unit: ' 单', color: '#4ade80' },
  { label: '活跃用户', value: '48,320', unit: ' 人', color: '#f7c365' },
  { label: '转化率', value: '5.68', unit: '%', color: '#f87171' },
  { label: '客单价', value: '263', unit: '¥', color: '#c084fc' },
]

export interface RateItem {
  label: string
  value: number
  color: string
}

const DEMO_RATES: RateItem[] = [
  { label: '销售目标达成率', value: 78.4, color: '#00eaff' },
  { label: '回款达成率', value: 64.2, color: '#4ade80' },
  { label: '用户增长目标', value: 55.9, color: '#f7c365' },
  { label: '工单处理率', value: 91.3, color: '#c084fc' },
]

export interface RankingItem {
  name: string
  value: number
  percent: number
}

const DEMO_RANKING: RankingItem[] = [
  { name: '华东大区', value: 986420, percent: 100 },
  { name: '华南大区', value: 752100, percent: 76 },
  { name: '华北大区', value: 634800, percent: 64 },
  { name: '西南大区', value: 442160, percent: 45 },
  { name: '华中大区', value: 338200, percent: 34 },
  { name: '西北大区', value: 214000, percent: 22 },
  { name: '东北大区', value: 182500, percent: 18 },
  { name: '青藏大区', value: 88200, percent: 9 },
]

/**
 * 🔑 大屏会话：加载状态、系统统计数据、看板标题/数据集、KPI/进度/榜单数据与时钟。
 *   图表渲染由 useScreenCharts 负责。
 */
export function useScreenDashboard(opts: { renderPie: (data?: PieDatum[]) => void }) {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const errorMsg = ref('')
  const stats = ref<SystemStats | null>(null)
  const screenTitle = ref('企业运营数据驾驶舱')
  const midChartTitle = ref('全国销售大屏')

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

  /**
   * 顶部 KPI 卡片: 优先使用后端 monitor/stats 接口的真实数据,
   * 若接口失败则回退到内置的演示数据 (避免页面空白)。
   */
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

  const rates = ref<RateItem[]>(DEMO_RATES)
  const ranking = ref<RankingItem[]>(DEMO_RANKING)

  /** 加载系统统计数据 (用于顶部 KPI 卡片) */
  async function loadStats() {
    try {
      const res = await getSystemStats()
      stats.value = res.data
    } catch {
      // 静默失败, 使用 fallback demo 数据
    }
  }

  /** 从后端布局中收窄出 datasetId（layout 为自由结构，按 unknown 读取） */
  function extractDatasetId(layout: unknown): number | undefined {
    if (typeof layout !== 'object' || layout === null || !('datasetId' in layout)) return undefined
    return Number((layout as { datasetId?: unknown }).datasetId) || undefined
  }

  /**
   * 加载指定 dashboard 的数据
   * 若路由有 :id 参数, 尝试加载该 dashboard 并从中提取数据集执行结果用于图表
   */
  async function loadDashboard() {
    const id = route.params.id
    if (!id) return

    try {
      const res = await getDashboardDetail(Number(id))
      const dashboard = res.data
      if (dashboard?.name) {
        screenTitle.value = dashboard.name
      }
      const datasetId = extractDatasetId(dashboard?.layout)
      if (datasetId) {
        try {
          const dsRes = await executeDataset(datasetId, { limit: 100 })
          const rows = dsRes.data.rows || []
          if (rows.length > 0) {
            // 假设数据集有 name 和 value 列, 用于饼图
            const pieData = rows
              .slice(0, 8)
              .map((r) => ({
                name: String(r.name || r.label || r.region || '未知'),
                value: Number(r.value || r.count || r.amount || 0),
              }))
              .filter((d) => d.value > 0)
            if (pieData.length > 0) {
              opts.renderPie(pieData)
            }
          }
        } catch {
          // 数据集执行失败, 使用默认渲染
        }
      }
    } catch {
      // dashboard 加载失败, 不阻断整个大屏渲染
    }
  }

  /** 启动页面：时钟、数据加载、30 秒统计轮询（由页面 mounted 时调用） */
  async function init() {
    loading.value = true
    tickClock()
    clockTimer = window.setInterval(tickClock, 1000)

    // 并行加载统计和 dashboard 数据
    await Promise.allSettled([loadStats(), loadDashboard()])

    loading.value = false

    // 每 30 秒刷新一次统计
    statsTimer = window.setInterval(() => {
      loadStats()
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
    midChartTitle,
    fullscreen,
    toggleFullscreen,
    back,
    nowText,
    kpis,
    rates,
    ranking,
    init,
    stop,
  }
}

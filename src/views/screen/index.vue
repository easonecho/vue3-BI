<template>
  <div class="screen-page">
    <div class="screen-bg">
      <div class="screen-bg__grid" />
      <div class="screen-bg__radar" />
    </div>
    <header class="screen-header">
      <div class="screen-header__title">
        <span class="title-main">{{ screenTitle }}</span>
      </div>
      <div class="screen-header__meta">
        <span>{{ nowText }}</span>
        <el-button size="small" @click="back">返回系统</el-button>
        <el-button size="small" type="primary" @click="toggleFullscreen">
          {{ fullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="screen-loading">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <span>正在加载大屏数据...</span>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="errorMsg" class="screen-error">
      <el-icon :size="32"><WarningFilled /></el-icon>
      <span>{{ errorMsg }}</span>
    </div>

    <!-- 大屏内容 -->
    <template v-else>
      <section class="screen-kpi">
        <div class="kpi-card" v-for="k in kpis" :key="k.label">
          <div class="kpi-card__label">{{ k.label }}</div>
          <div class="kpi-card__num" :style="{ color: k.color }">
            {{ k.value }}<span class="kpi-unit">{{ k.unit }}</span>
          </div>
        </div>
      </section>
      <section class="screen-body">
        <div class="screen-col screen-col--left">
          <div class="panel"><div class="panel__title">业务构成</div><div ref="pieRef" class="chart" /></div>
          <div class="panel"><div class="panel__title">目标达成率</div>
            <div class="rate-grid">
              <div v-for="r in rates" :key="r.label" class="rate-item">
                <div class="rate-item__top"><span>{{ r.label }}</span><span class="rate-num">{{ r.value.toFixed(1) }}%</span></div>
                <el-progress :percentage="r.value" :stroke-width="10" :color="r.color" :show-text="false" />
              </div>
            </div>
          </div>
        </div>
        <div class="screen-col screen-col--mid">
          <div class="panel"><div class="panel__title">{{ midChartTitle }}</div><div ref="barRef" class="chart chart--main" /></div>
        </div>
        <div class="screen-col screen-col--right">
          <div class="panel"><div class="panel__title">流量趋势 (近30日)</div><div ref="lineRef" class="chart" /></div>
          <div class="panel"><div class="panel__title">实时榜单 TOP 8</div>
            <div class="ranking">
              <div class="ranking__row" v-for="(row, i) in ranking" :key="row.name">
                <div class="ranking__rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</div>
                <div class="ranking__name">{{ row.name }}</div>
                <div class="ranking__bar"><div class="ranking__bar-inner" :style="{ width: row.percent + '%' }" /></div>
                <div class="ranking__val">{{ formatK(row.value) }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
    <footer class="screen-footer"><span>© BI 低代码平台 · 数据可视化大屏</span></footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import { getSystemStats, type SystemStats } from '@/api/monitor'
import { getDashboardDetail } from '@/api/dashboard'
import { executeDataset } from '@/api/dataset'

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
function back() { router.push('/dashboard') }

const nowText = ref('')
let clockTimer: number | undefined
let statsTimer: number | undefined
function pad(n: number) { return n < 10 ? '0' + n : '' + n }
function tickClock() {
  const d = new Date()
  nowText.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 顶部 KPI 卡片: 优先使用后端 monitor/stats 接口的真实数据,
 * 若接口失败则回退到内置的演示数据 (避免页面空白)。
 */
const kpis = computed(() => {
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
  // fallback demo data
  return [
    { label: '总销售额', value: '¥ 3,284,195', unit: '', color: '#00eaff' },
    { label: '订单数', value: '12,486', unit: ' 单', color: '#4ade80' },
    { label: '活跃用户', value: '48,320', unit: ' 人', color: '#f7c365' },
    { label: '转化率', value: '5.68', unit: '%', color: '#f87171' },
    { label: '客单价', value: '263', unit: '¥', color: '#c084fc' },
  ]
})

const rates = ref([
  { label: '销售目标达成率', value: 78.4, color: '#00eaff' },
  { label: '回款达成率', value: 64.2, color: '#4ade80' },
  { label: '用户增长目标', value: 55.9, color: '#f7c365' },
  { label: '工单处理率', value: 91.3, color: '#c084fc' },
])

const ranking = ref([
  { name: '华东大区', value: 986420, percent: 100 },
  { name: '华南大区', value: 752100, percent: 76 },
  { name: '华北大区', value: 634800, percent: 64 },
  { name: '西南大区', value: 442160, percent: 45 },
  { name: '华中大区', value: 338200, percent: 34 },
  { name: '西北大区', value: 214000, percent: 22 },
  { name: '东北大区', value: 182500, percent: 18 },
  { name: '青藏大区', value: 88200, percent: 9 },
])

function formatK(n: number) {
  return n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString()
}

const pieRef = ref<HTMLDivElement | null>(null)
const lineRef = ref<HTMLDivElement | null>(null)
const barRef = ref<HTMLDivElement | null>(null)
let charts: echarts.ECharts[] = []

/**
 * 渲染饼图: 业务构成
 * 若指定了 dashboardId 且对应数据集可执行, 则使用真实数据; 否则使用 demo 数据。
 */
function renderPie(data?: { value: number; name: string }[]) {
  if (!pieRef.value) return
  const c = echarts.init(pieRef.value); charts.push(c)
  const pieData = data && data.length > 0 ? data : [
    { value: 1048, name: '线上商城' },
    { value: 735, name: '直营门店' },
    { value: 580, name: '经销渠道' },
    { value: 484, name: '代理分销' },
    { value: 300, name: '其他' },
  ]
  c.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, left: 'center', textStyle: { color: '#cfe4ff', fontSize: 11 } },
    color: ['#00eaff', '#4ade80', '#f7c365', '#c084fc', '#f87171', '#60a5fa'],
    series: [{
      type: 'pie', radius: ['40%', '68%'], center: ['50%', '45%'],
      itemStyle: { borderColor: '#0b1120', borderWidth: 2 },
      label: { color: '#e0f2ff', fontSize: 11 },
      data: pieData,
    }],
  })
}

function renderLine() {
  if (!lineRef.value) return
  const c = echarts.init(lineRef.value); charts.push(c)
  const dates = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  c.setOption({
    grid: { left: 40, right: 20, top: 28, bottom: 28 },
    legend: { data: ['访问量', '转化量'], textStyle: { color: '#cfe4ff', fontSize: 11 }, right: 10, top: 0 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category', boundaryGap: false, data: dates,
      axisLine: { lineStyle: { color: 'rgba(111,166,255,.4)' } },
      axisLabel: { color: '#8da4c8', fontSize: 10, interval: 4 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(111,166,255,.15)' } },
      axisLabel: { color: '#8da4c8', fontSize: 10 },
    },
    color: ['#00eaff', '#4ade80'],
    series: [
      {
        name: '访问量', type: 'line', smooth: true, symbol: 'none',
        data: dates.map(() => Math.round(3000 + Math.random() * 3500)),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,234,255,.45)' },
            { offset: 1, color: 'rgba(0,234,255,0)' },
          ]),
        },
      },
      {
        name: '转化量', type: 'line', smooth: true, symbol: 'none',
        data: dates.map(() => Math.round(1500 + Math.random() * 1800)),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(74,222,128,.4)' },
            { offset: 1, color: 'rgba(74,222,128,0)' },
          ]),
        },
      },
    ],
  })
}

function renderBar() {
  if (!barRef.value) return
  const c = echarts.init(barRef.value); charts.push(c)
  const regions = ['北京', '上海', '广东', '江苏', '浙江', '四川', '山东', '湖北', '河南', '福建']
  c.setOption({
    grid: { left: 44, right: 24, top: 32, bottom: 36 },
    legend: { data: ['实际销售额', '销售目标'], textStyle: { color: '#cfe4ff', fontSize: 12 }, right: 16, top: 0 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category', data: regions,
      axisLine: { lineStyle: { color: 'rgba(111,166,255,.4)' } },
      axisLabel: { color: '#cfe4ff', fontSize: 12 },
    },
    yAxis: {
      type: 'value', name: '(万元)', nameTextStyle: { color: '#8da4c8' },
      splitLine: { lineStyle: { color: 'rgba(111,166,255,.15)' } },
      axisLabel: { color: '#8da4c8' },
    },
    series: [
      {
        name: '实际销售额', type: 'bar', data: regions.map(() => Math.round(80 + Math.random() * 220)),
        barWidth: 14,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00eaff' },
            { offset: 1, color: 'rgba(0,234,255,.2)' },
          ]),
        },
      },
      {
        name: '销售目标', type: 'bar', data: regions.map(() => Math.round(200 + Math.random() * 60)),
        barWidth: 14,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: 'rgba(247,195,101,.7)' },
      },
    ],
  })
}

function resize() { charts.forEach(c => c.resize()) }

/**
 * 加载系统统计数据 (用于顶部 KPI 卡片)
 */
async function loadStats() {
  try {
    const res = await getSystemStats()
    stats.value = res.data
  } catch {
    // 静默失败, 使用 fallback demo 数据
  }
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
    // 若 dashboard.layout 包含数据集绑定信息, 可扩展执行数据集取真实数据
    // 此处仅作示例: 若 layout 中有 datasetId, 执行数据集获取饼图数据
    const layout = dashboard?.layout as any
    if (layout?.datasetId) {
      try {
        const dsRes = await executeDataset(Number(layout.datasetId), { limit: 100 })
        const rows = dsRes.data.rows || []
        if (rows.length > 0) {
          // 假设数据集有 name 和 value 列, 用于饼图
          const pieData = rows.slice(0, 8).map((r: any) => ({
            name: String(r.name || r.label || r.region || '未知'),
            value: Number(r.value || r.count || r.amount || 0),
          })).filter((d: any) => d.value > 0)
          if (pieData.length > 0) {
            await nextTick()
            renderPie(pieData)
            return
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

onMounted(async () => {
  loading.value = true
  tickClock()
  clockTimer = window.setInterval(tickClock, 1000)

  // 并行加载统计和 dashboard 数据
  await Promise.allSettled([loadStats(), loadDashboard()])

  loading.value = false
  await nextTick()
  renderPie()
  renderLine()
  renderBar()
  window.addEventListener('resize', resize)

  // 每 30 秒刷新一次统计
  statsTimer = window.setInterval(() => {
    loadStats()
  }, 30000)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (statsTimer) clearInterval(statsTimer)
  window.removeEventListener('resize', resize)
  charts.forEach(c => c.dispose())
  charts = []
})
</script>

<style scoped lang="less">
.screen-page {
  --c-bg: #050b1a; --c-accent: #00eaff; --c-text: #e0f2ff;
  width: 100vw; min-height: 100vh; background: var(--c-bg); color: var(--c-text);
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  position: relative; overflow-x: hidden;
}
.screen-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,170,255,.22) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 50% 110%, rgba(96,165,250,.18) 0%, transparent 60%),
    linear-gradient(180deg, #050b1a 0%, #081226 40%, #060c1e 100%);
  &__grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(111,166,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(111,166,255,.07) 1px, transparent 1px);
    background-size: 56px 56px; mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 100%);
  }
  &__radar {
    position: absolute; width: 700px; height: 700px; left: 50%; top: 50%;
    transform: translate(-50%,-50%); border-radius: 50%;
    background: repeating-radial-gradient(circle at center, transparent 0 60px, rgba(0,234,255,.08) 60px 61px);
    mask-image: radial-gradient(circle, #000 10%, transparent 60%);
  }
}
.screen-header {
  position: relative; z-index: 2; height: 64px; display: flex;
  align-items: center; justify-content: space-between;
  padding: 0 24px; border-bottom: 1px solid rgba(0,234,255,.18);
  background: linear-gradient(180deg, rgba(0,80,160,.25) 0%, transparent 100%);
  .title-main {
    font-size: 26px; font-weight: 700; letter-spacing: 6px;
    background: linear-gradient(180deg, #fff 0%, #a7e7ff 60%, #49b4ff 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  &__meta { display: flex; align-items: center; gap: 14px; color: #9fc3e8; font-size: 13px; }
}
.screen-kpi { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; padding: 14px; }
.kpi-card {
  padding: 14px 18px; border-radius: 4px; border: 1px solid rgba(0,234,255,.22);
  background: linear-gradient(135deg, rgba(14,30,62,.85), rgba(12,20,40,.85));
  box-shadow: 0 0 18px rgba(0,180,255,.1) inset;
  &__label { font-size: 13px; color: #9fc3e8; }
  &__num {
    font-size: 32px; font-weight: 700; margin-top: 6px; text-shadow: 0 0 12px currentColor;
    .kpi-unit { font-size: 14px; font-weight: 400; opacity: .75; margin-left: 4px; text-shadow: none; }
  }
}
.screen-body {
  position: relative; z-index: 2; padding: 0 14px 14px;
  display: grid; grid-template-columns: 360px 1fr 380px; gap: 14px;
  height: calc(100vh - 64px - 128px - 32px); min-height: 580px;
}
.screen-col { display: grid; grid-template-rows: 1fr 1fr; gap: 14px; }
.panel {
  position: relative; padding: 18px 14px 14px;
  border: 1px solid rgba(0,234,255,.25); border-radius: 6px;
  background: linear-gradient(135deg, rgba(14,24,50,.85), rgba(12,18,38,.85));
  box-shadow: 0 0 24px rgba(0,200,255,.12) inset;
  &__title {
    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    padding: 2px 22px; font-size: 15px; font-weight: 600; letter-spacing: 2px; color: #e0f7ff;
    background: linear-gradient(90deg, rgba(0,234,255,.08), rgba(0,234,255,.28), rgba(0,234,255,.08));
    border: 1px solid rgba(0,234,255,.35); border-radius: 3px;
  }
}
.chart { width: 100%; height: 100%; }
.chart--main { height: 100%; }
.rate-grid {
  display: flex; flex-direction: column; gap: 14px; padding: 6px 4px;
  .rate-item__top {
    display: flex; justify-content: space-between; font-size: 13px; color: #cfe4ff;
    .rate-num { color: var(--c-accent); font-size: 15px; }
  }
}
.ranking {
  display: flex; flex-direction: column; gap: 9px; padding: 2px;
  &__row {
    display: grid; grid-template-columns: 32px 80px 1fr 70px;
    align-items: center; gap: 10px; font-size: 13px;
  }
  &__rank {
    width: 24px; height: 24px; line-height: 24px; text-align: center;
    border-radius: 4px; background: rgba(111,166,255,.12); color: #cfe4ff;
    font-weight: 600; font-size: 12px;
    &.rank-1 { background: linear-gradient(135deg, #f87171, #f97316); color: #fff; }
    &.rank-2 { background: linear-gradient(135deg, #fb923c, #f7c365); color: #fff; }
    &.rank-3 { background: linear-gradient(135deg, #f7c365, #eab308); color: #2b1f00; }
  }
  &__name { color: #cfe4ff; }
  &__bar { height: 8px; background: rgba(111,166,255,.1); border-radius: 4px; overflow: hidden; }
  &__bar-inner { height: 100%; border-radius: 4px; background: #00eaff; transition: width .6s; box-shadow: 0 0 6px currentColor; }
  &__val { color: #9fc3e8; text-align: right; font-size: 14px; }
}
.screen-footer {
  position: relative; z-index: 2; border-top: 1px solid rgba(0,234,255,.15);
  text-align: center; padding: 8px 0; font-size: 12px; color: #5a6d8c;
}
.screen-loading, .screen-error {
  position: relative; z-index: 2; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  min-height: 300px; color: #9fc3e8;
}
@media (max-width: 1600px) { .screen-body { grid-template-columns: 320px 1fr 340px; } }
@media (max-width: 1280px) { .screen-body { grid-template-columns: 1fr; height: auto; } }
</style>
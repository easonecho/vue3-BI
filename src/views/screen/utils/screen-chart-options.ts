import { graphic } from 'echarts/core'

export interface PieDatum {
  value: number
  name: string
}

/** 类目轴图表数据（柱状/折线共用） */
export interface CategorySeriesData {
  categories: string[]
  series: Array<{ name: string; data: number[] }>
}

const PIE_COLORS = ['#00eaff', '#4ade80', '#f7c365', '#c084fc', '#f87171', '#60a5fa']
const CHART_COLORS = ['#00eaff', '#4ade80', '#f7c365', '#c084fc', '#f87171', '#60a5fa']

/** #rrggbb → rgba，用于面积图渐变 */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const DEMO_PIE_DATA: PieDatum[] = [
  { value: 1048, name: '线上商城' },
  { value: 735, name: '直营门店' },
  { value: 580, name: '经销渠道' },
  { value: 484, name: '代理分销' },
  { value: 300, name: '其他' },
]

/** 饼图：业务构成（数据为空时回退演示数据） */
export function buildPieOption(data?: PieDatum[]) {
  const pieData = data && data.length > 0 ? data : DEMO_PIE_DATA
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, left: 'center', textStyle: { color: '#cfe4ff', fontSize: 11 } },
    color: PIE_COLORS,
    series: [
      {
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '45%'],
        itemStyle: { borderColor: '#0b1120', borderWidth: 2 },
        label: { color: '#e0f2ff', fontSize: 11 },
        data: pieData,
      },
    ],
  }
}

const DEMO_LINE_DATA: CategorySeriesData = {
  categories: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
  series: [
    { name: '访问量', data: Array.from({ length: 30 }, () => Math.round(3000 + Math.random() * 3500)) },
    { name: '转化量', data: Array.from({ length: 30 }, () => Math.round(1500 + Math.random() * 1800)) },
  ],
}

const DEMO_BAR_DATA: CategorySeriesData = {
  categories: ['北京', '上海', '广东', '江苏', '浙江', '四川', '山东', '湖北', '河南', '福建'],
  series: [
    {
      name: '实际销售额',
      data: Array.from({ length: 10 }, () => Math.round(80 + Math.random() * 220)),
    },
    {
      name: '销售目标',
      data: Array.from({ length: 10 }, () => Math.round(200 + Math.random() * 60)),
    },
  ],
}

/** 折线图：优先使用真实数据，为空时回退演示数据 */
export function buildLineOption(data?: CategorySeriesData | null) {
  const source = data && data.series.length > 0 ? data : DEMO_LINE_DATA
  return {
    grid: { left: 40, right: 20, top: 28, bottom: 28 },
    legend: {
      data: source.series.map((item) => item.name),
      textStyle: { color: '#cfe4ff', fontSize: 11 },
      right: 10,
      top: 0,
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: source.categories,
      axisLine: { lineStyle: { color: 'rgba(111,166,255,.4)' } },
      axisLabel: {
        color: '#8da4c8',
        fontSize: 10,
        interval: data ? 'auto' : 4,
      },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(111,166,255,.15)' } },
      axisLabel: { color: '#8da4c8', fontSize: 10 },
    },
    color: CHART_COLORS,
    series: source.series.map((item, index) => {
      const color = CHART_COLORS[index % CHART_COLORS.length]
      return {
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: item.data,
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withAlpha(color, 0.4) },
            { offset: 1, color: withAlpha(color, 0) },
          ]),
        },
      }
    }),
  }
}

/** 柱状图：优先使用真实数据，为空时回退演示数据 */
export function buildBarOption(data?: CategorySeriesData | null) {
  const source = data && data.series.length > 0 ? data : DEMO_BAR_DATA
  const isDemo = !data || data.series.length === 0
  return {
    grid: { left: 44, right: 24, top: 32, bottom: 36 },
    legend: {
      data: source.series.map((item) => item.name),
      textStyle: { color: '#cfe4ff', fontSize: 12 },
      right: 16,
      top: 0,
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: source.categories,
      axisLine: { lineStyle: { color: 'rgba(111,166,255,.4)' } },
      axisLabel: { color: '#cfe4ff', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      name: isDemo ? '(万元)' : '',
      nameTextStyle: { color: '#8da4c8' },
      splitLine: { lineStyle: { color: 'rgba(111,166,255,.15)' } },
      axisLabel: { color: '#8da4c8' },
    },
    series: source.series.map((item, index) => ({
      name: item.name,
      type: 'bar',
      data: item.data,
      barWidth: 14,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color:
          index === 0
            ? new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#00eaff' },
                { offset: 1, color: 'rgba(0,234,255,.2)' },
              ])
            : index === 1
              ? 'rgba(247,195,101,.7)'
              : withAlpha(CHART_COLORS[index % CHART_COLORS.length], 0.7),
      },
    })),
  }
}

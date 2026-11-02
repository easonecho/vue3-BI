import { graphic } from 'echarts/core'

export interface PieDatum {
  value: number
  name: string
}

const PIE_COLORS = ['#00eaff', '#4ade80', '#f7c365', '#c084fc', '#f87171', '#60a5fa']

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

/** 折线图：近 30 日流量趋势 */
export function buildLineOption() {
  const dates = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  return {
    grid: { left: 40, right: 20, top: 28, bottom: 28 },
    legend: {
      data: ['访问量', '转化量'],
      textStyle: { color: '#cfe4ff', fontSize: 11 },
      right: 10,
      top: 0,
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
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
        name: '访问量',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: dates.map(() => Math.round(3000 + Math.random() * 3500)),
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,234,255,.45)' },
            { offset: 1, color: 'rgba(0,234,255,0)' },
          ]),
        },
      },
      {
        name: '转化量',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: dates.map(() => Math.round(1500 + Math.random() * 1800)),
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(74,222,128,.4)' },
            { offset: 1, color: 'rgba(74,222,128,0)' },
          ]),
        },
      },
    ],
  }
}

/** 柱状图：全国销售大屏 */
export function buildBarOption() {
  const regions = ['北京', '上海', '广东', '江苏', '浙江', '四川', '山东', '湖北', '河南', '福建']
  return {
    grid: { left: 44, right: 24, top: 32, bottom: 36 },
    legend: {
      data: ['实际销售额', '销售目标'],
      textStyle: { color: '#cfe4ff', fontSize: 12 },
      right: 16,
      top: 0,
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: regions,
      axisLine: { lineStyle: { color: 'rgba(111,166,255,.4)' } },
      axisLabel: { color: '#cfe4ff', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      name: '(万元)',
      nameTextStyle: { color: '#8da4c8' },
      splitLine: { lineStyle: { color: 'rgba(111,166,255,.15)' } },
      axisLabel: { color: '#8da4c8' },
    },
    series: [
      {
        name: '实际销售额',
        type: 'bar',
        data: regions.map(() => Math.round(80 + Math.random() * 220)),
        barWidth: 14,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00eaff' },
            { offset: 1, color: 'rgba(0,234,255,.2)' },
          ]),
        },
      },
      {
        name: '销售目标',
        type: 'bar',
        data: regions.map(() => Math.round(200 + Math.random() * 60)),
        barWidth: 14,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: 'rgba(247,195,101,.7)' },
      },
    ],
  }
}

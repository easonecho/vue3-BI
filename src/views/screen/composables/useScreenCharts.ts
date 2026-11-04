import { ref } from 'vue'
import { getInstanceByDom, init as echartsInit, use, type ECharts } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  type CategorySeriesData,
  type PieDatum,
  buildBarOption,
  buildLineOption,
  buildPieOption,
} from '../utils/screen-chart-options'

// 🔑 ECharts 按需注册（模块级执行一次）：饼/折线/柱状 + 直角坐标系/图例/提示框 + Canvas 渲染器
use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

/**
 * 🔑 大屏图表生命周期：三个图表实例的创建、渲染、resize 与销毁。
 *   容器 ref 由调用方在模板中绑定。
 */
export function useScreenCharts() {
  const pieRef = ref<HTMLDivElement | null>(null)
  const lineRef = ref<HTMLDivElement | null>(null)
  const barRef = ref<HTMLDivElement | null>(null)
  let charts: ECharts[] = []

  /**
   * 复用已有 ECharts 实例。
   * 避免同一容器重复 init（会导致内存泄漏与图表叠加）。
   */
  function ensureChart(target: HTMLDivElement | null): ECharts | null {
    if (!target) return null
    const existing = getInstanceByDom(target)
    if (existing) {
      if (!charts.includes(existing)) charts.push(existing)
      return existing
    }
    const instance = echartsInit(target)
    charts.push(instance)
    return instance
  }

  /** 业务构成饼图；传入真实数据集结果时替换演示数据 */
  function renderPie(data?: PieDatum[]) {
    const chart = ensureChart(pieRef.value)
    if (!chart) return
    chart.setOption(buildPieOption(data), true)
  }

  /** 流量趋势折线图；传入真实数据集结果时替换演示数据 */
  function renderLine(data?: CategorySeriesData | null) {
    const chart = ensureChart(lineRef.value)
    if (!chart) return
    chart.setOption(buildLineOption(data), true)
  }

  /** 全国销售柱状图；传入真实数据集结果时替换演示数据 */
  function renderBar(data?: CategorySeriesData | null) {
    const chart = ensureChart(barRef.value)
    if (!chart) return
    chart.setOption(buildBarOption(data), true)
  }

  function resize() {
    charts.forEach((c) => c.resize())
  }

  function dispose() {
    charts.forEach((c) => c.dispose())
    charts = []
  }

  return { pieRef, lineRef, barRef, renderPie, renderLine, renderBar, resize, dispose }
}

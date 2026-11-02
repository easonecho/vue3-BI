import { ref } from 'vue'
import { init as echartsInit, use, type ECharts } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  type PieDatum,
  buildBarOption,
  buildLineOption,
  buildPieOption,
} from './screen-chart-options'

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

  /** 业务构成饼图；传入真实数据集结果时替换演示数据 */
  function renderPie(data?: PieDatum[]) {
    if (!pieRef.value) return
    const c = echartsInit(pieRef.value)
    charts.push(c)
    c.setOption(buildPieOption(data))
  }

  function renderLine() {
    if (!lineRef.value) return
    const c = echartsInit(lineRef.value)
    charts.push(c)
    c.setOption(buildLineOption())
  }

  function renderBar() {
    if (!barRef.value) return
    const c = echartsInit(barRef.value)
    charts.push(c)
    c.setOption(buildBarOption())
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

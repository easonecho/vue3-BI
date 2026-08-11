import { init, use, type ComposeOption, type ECharts } from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import { LineChart, type LineSeriesOption } from 'echarts/charts'
import { PieChart, type PieSeriesOption } from 'echarts/charts'
import { ScatterChart, type ScatterSeriesOption } from 'echarts/charts'
import { GaugeChart, type GaugeSeriesOption } from 'echarts/charts'
import {
  TitleComponent,
  type TitleComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
  LegendComponent,
  type LegendComponentOption,
  GridComponent,
  type GridComponentOption,
  DataZoomComponent,
  type DataZoomComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  CanvasRenderer,
])

export type ECOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | GaugeSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
  | DataZoomComponentOption
>

export { init }
export type { ECharts }

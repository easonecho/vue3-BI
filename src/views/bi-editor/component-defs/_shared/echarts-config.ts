import { init, use, type ComposeOption, type ECharts } from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import { LineChart, type LineSeriesOption } from 'echarts/charts'
import { PieChart, type PieSeriesOption } from 'echarts/charts'
import { ScatterChart, type ScatterSeriesOption } from 'echarts/charts'
import { GaugeChart, type GaugeSeriesOption } from 'echarts/charts'
import { FunnelChart, type FunnelSeriesOption } from 'echarts/charts'
import { RadarChart, type RadarSeriesOption } from 'echarts/charts'
import { HeatmapChart, type HeatmapSeriesOption } from 'echarts/charts'
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
  VisualMapComponent,
  type VisualMapComponentOption,
  RadarComponent,
  type RadarComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  FunnelChart,
  RadarChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  VisualMapComponent,
  RadarComponent,
  CanvasRenderer,
])

export type ECOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | GaugeSeriesOption
  | FunnelSeriesOption
  | RadarSeriesOption
  | HeatmapSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
  | DataZoomComponentOption
  | VisualMapComponentOption
  | RadarComponentOption
>

export { init }
export type { ECharts }

import { init, use, type ComposeOption, type ECharts } from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import { LineChart, type LineSeriesOption } from 'echarts/charts'
import { PieChart, type PieSeriesOption } from 'echarts/charts'
import { ScatterChart, type ScatterSeriesOption } from 'echarts/charts'
import { GaugeChart, type GaugeSeriesOption } from 'echarts/charts'
import { FunnelChart, type FunnelSeriesOption } from 'echarts/charts'
import { RadarChart, type RadarSeriesOption } from 'echarts/charts'
import { HeatmapChart, type HeatmapSeriesOption } from 'echarts/charts'
import { TreemapChart, type TreemapSeriesOption } from 'echarts/charts'
import { SankeyChart, type SankeySeriesOption } from 'echarts/charts'
import { SunburstChart, type SunburstSeriesOption } from 'echarts/charts'
import { GraphChart, type GraphSeriesOption } from 'echarts/charts'
import { MapChart, type MapSeriesOption } from 'echarts/charts'
import { ParallelChart } from 'echarts/charts'
// 🔑 3D 图表（WebGL 渲染）：echarts-gl 扩展
//   类型不加入 ECOption 联合，避免 echarts-gl 2.x 与 echarts 6 类型不兼容引发的 TS 错误。
//   3D 图表组件的 specificOption 用 as ECOption 断言。
//   echarts-gl 2.x 未提供 .d.ts 类型声明，用 @ts-expect-error 兜底。
//   实际导出名（见 echarts-gl/lib/export/charts.js）：Bar3DChart / Line3DChart /
//   Scatter3DChart / Lines3DChart / Polygons3DChart / SurfaceChart / Map3DChart /
//   ScatterGLChart / GraphGLChart / FlowGLChart / LinesGLChart。
//   当前只注册在用的 Bar3DChart + Grid3DComponent，其余按需扩展。
// @ts-expect-error echarts-gl 无类型声明
import { Bar3DChart } from 'echarts-gl/charts'
// @ts-expect-error echarts-gl 无类型声明
import { Grid3DComponent } from 'echarts-gl/components'
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
  GeoComponent,
  type GeoComponentOption,
  ParallelComponent,
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
  TreemapChart,
  SankeyChart,
  SunburstChart,
  GraphChart,
  MapChart,
  ParallelChart,
  // 🔑 3D 图表运行时注册（WebGL）
  Bar3DChart,
  Grid3DComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  VisualMapComponent,
  RadarComponent,
  GeoComponent,
  ParallelComponent,
  CanvasRenderer,
])

// 🔑 注意：ParallelSeriesOption / ParallelComponentOption 不加入 ECOption 联合。
//   原因：ParallelComponentOption 会把 xAxis/yAxis 类型污染为包含 ParallelAxisOption，
//   导致所有图表组件的 specificOption 赋值报 TS2322。
//   运行时通过 use(ParallelChart, ParallelComponent) 已注册，类型层面用 as ECOption 断言即可。
export type ECOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | GaugeSeriesOption
  | FunnelSeriesOption
  | RadarSeriesOption
  | HeatmapSeriesOption
  | TreemapSeriesOption
  | SankeySeriesOption
  | SunburstSeriesOption
  | GraphSeriesOption
  | MapSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
  | DataZoomComponentOption
  | VisualMapComponentOption
  | RadarComponentOption
  | GeoComponentOption
>

export { init }
export type { ECharts }

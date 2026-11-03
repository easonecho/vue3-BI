import { init, use, type ComposeOption, type ECharts } from 'echarts/core'
import {
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
  type BarSeriesOption,
  type LineSeriesOption,
  type PieSeriesOption,
  type ScatterSeriesOption,
  type GaugeSeriesOption,
  type FunnelSeriesOption,
  type RadarSeriesOption,
  type HeatmapSeriesOption,
  type TreemapSeriesOption,
  type SankeySeriesOption,
  type SunburstSeriesOption,
  type GraphSeriesOption,
  type MapSeriesOption,
} from 'echarts/charts'
// 🔑 3D 图表（WebGL 渲染）：echarts-gl 扩展。
//   刻意不在模块顶层静态 import/register：3D 图表占比很低，静态引入会让所有看板
//   都额外下载约 500 KB 的 WebGL 依赖。改为由 3D 组件调用 ensureEchartsGl() 懒注册。
//   echarts-gl 2.x 未提供 .d.ts 类型声明，动态 import 后用断言处理。
//   实际导出名（见 echarts-gl/lib/export/charts.js）：Bar3DChart / Line3DChart /
//   Scatter3DChart / Lines3DChart / Polygons3DChart / SurfaceChart / Map3DChart /
//   ScatterGLChart / GraphGLChart / FlowGLChart / LinesGLChart。
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

/**
 * 懒注册 echarts-gl 的 3D 渲染能力（Bar3D + Grid3D）。
 * 仅当看板实际包含 3D 组件时才会下载 echarts-gl chunk。
 */
let glReady: Promise<void> | null = null
export function ensureEchartsGl(): Promise<void> {
  if (!glReady) {
    glReady = Promise.all([import('echarts-gl/charts'), import('echarts-gl/components')])
      .then(([charts, components]) => {
        use(
          [
            (charts as unknown as { Bar3DChart: unknown }).Bar3DChart,
            (components as unknown as { Grid3DComponent: unknown }).Grid3DComponent,
          ] as unknown as Parameters<typeof use>[0],
        )
      })
      .catch((err) => {
        // 注册失败时清空缓存，允许后续重试
        glReady = null
        throw err
      })
  }
  return glReady
}

/**
 * 单个系列配置的联合类型（从 `ECOption['series']` 中抽出元素类型）。
 * 🔑 动态拼装 series 数组时用它声明数组，例如：
 *      const seriesList: ChartSeriesOption[] = []
 *   这样 `series: seriesList` 可直接通过类型检查，不必再写 `series: seriesList as any`。
 */
export type ChartSeriesOption = Exclude<NonNullable<ECOption['series']>, readonly unknown[]>

import type { PropField } from '../props'
import { chartDataZoomSchema } from './data-zoom'
import { chartXAxisSchema } from './x-axis'
import { chartYAxisSchema } from './y-axis'

/** 🔑 坐标轴 / 数据缩放专属 Schema（仅柱/折线/散点等带 X/Y 轴的图表使用） */
export const chartAxesSchema: PropField[] = [
  ...chartXAxisSchema,
  ...chartYAxisSchema,
  ...chartDataZoomSchema,
]

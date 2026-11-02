import type { PropField } from '../props'
import { chartAnimationSchema } from './animation'
import { chartGridSchema } from './grid'
import { chartLegendSchema } from './legend'
import { chartTitleSchema } from './title'
import { chartTooltipSchema } from './tooltip'

/**
 * 🔑 所有图表通用 Schema（标题 / 图例 / 提示框 / 动画 / 画布内边距）。
 *   饼图、仪表盘等无坐标轴图表直接复用此 Schema。
 */
export const chartCommonSchema: PropField[] = [
  ...chartTitleSchema,
  ...chartLegendSchema,
  ...chartTooltipSchema,
  ...chartAnimationSchema,
  ...chartGridSchema,
]

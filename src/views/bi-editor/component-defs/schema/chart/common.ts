import type { PropField } from '../props'
import { chartAnnotationSchema } from './annotation'
import { chartAnimationSchema } from './animation'
import { chartConditionalFormatSchema } from './conditional-format'
import { chartGridSchema } from './grid'
import { chartLegendSchema } from './legend'
import { chartTitleSchema } from './title'
import { chartTooltipSchema } from './tooltip'

/**
 * 🔑 所有图表通用 Schema（标题 / 图例 / 提示框 / 动画 / 画布内边距 / 注释）。
 *   饼图、仪表盘等无坐标轴图表直接复用此 Schema。
 */
export const chartCommonSchema: PropField[] = [
  ...chartTitleSchema,
  ...chartLegendSchema,
  ...chartTooltipSchema,
  ...chartAnimationSchema,
  ...chartGridSchema,
  ...chartAnnotationSchema,
  ...chartConditionalFormatSchema,
  {
    key: 'clickAction',
    label: '点击行为',
    type: 'select',
    default: 'auto',
    options: [
      { label: '联动 / 下钻（默认）', value: 'auto' },
      { label: '打开明细', value: 'detail' },
    ],
    group: '交互',
    tip: '「打开明细」会按点击项的维度值查询原始数据行',
  },
]

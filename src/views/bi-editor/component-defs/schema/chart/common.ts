import type { PropField } from '../props'
import { chartAnnotationSchema } from './annotation'
import { chartAnimationSchema } from './animation'
import { chartConditionalFormatSchema } from './conditional-format'
import { chartGridSchema } from './grid'
import { chartLegendSchema } from './legend'
import { chartTitleSchema } from './title'
import { chartTooltipSchema } from './tooltip'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

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
    get label() {
      return t('editorMaterial.ui.clickAction')
    },
    type: 'select',
    default: 'auto',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.linkDrillDownDefault')
        },
        value: 'auto',
      },
      {
        get label() {
          return t('editorMaterial.ui.openDetails')
        },
        value: 'detail',
      },
    ],
    get group() {
      return t('editorMaterial.ui.interaction')
    },
    get tip() {
      return t('editorMaterial.ui.openDetailsQueriesRawRowsByTheClickedItemDimension')
    },
  },
]

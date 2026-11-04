/**
 * 🔑 组件属性 Schema 公共出口（barrel）。
 *
 *   具体定义按领域拆分到 `./schema` 下，本文件只做 re-export，
 *   保证外部 `from '../types'` / `from './types'` 的导入路径与符号保持不变：
 *
 *   - `schema/props.ts`      类型定义（PropField / ComponentDefinition 等）
 *   - `schema/options.ts`    调色板 / 字体 / 聚合方式等公共选项
 *   - `schema/presets.ts`    seriesStyles 列定义 + aggregatePropField
 *   - `schema/defaults.ts`   deriveDefaultProps / buildInitialSeriesStyles 等工具
 *   - `schema/chart/*`       图表 Schema（标题 / 图例 / 提示框 / 动画 / 坐标轴 …）
 *   - `schema/text.ts`       文本类组件基础 Schema
 */

export type {
  PropFieldType,
  VisibleWhen,
  SelectOption,
  TableColumnSchema,
  DataBindingField,
  PropField,
  ComponentDefinition,
} from './schema/props'

export {
  ECHARTS_DEFAULT_PALETTE,
  FONT_FAMILY_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  FONT_STYLE_OPTIONS,
  DEFAULT_FONT_FAMILY,
  AGGREGATE_OPTIONS,
} from './schema/options'

export {
  baseSeriesStylesWithAxesColumns,
  baseSeriesStylesNoAxesColumns,
  aggregatePropField,
  topNPropFields,
} from './schema/presets'

export {
  deriveDefaultProps,
  deriveDefaultPropsCached,
  buildInitialSeriesStyles,
  isFieldVisible,
} from './schema/defaults'

export {
  chartCommonSchema,
  chartAxesSchema,
  chartBaseSchema,
  buildSeriesLabelSchema,
} from './schema/chart'

export { textBaseSchema } from './schema/text'

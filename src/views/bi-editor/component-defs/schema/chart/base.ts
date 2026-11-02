import type { PropField } from '../props'
import { chartAxesSchema } from './axes'
import { chartCommonSchema } from './common'

/** 🔑 原全量 Schema 保留（通用 + 坐标轴），向后兼容 */
export const chartBaseSchema: PropField[] = [...chartCommonSchema, ...chartAxesSchema]

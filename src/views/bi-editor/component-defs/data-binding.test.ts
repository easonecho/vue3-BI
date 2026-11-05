import { describe, it, expect } from 'vitest'
import bar3dChartDefinition from './bar3d-chart'
import bubbleChartDefinition from './bubble-chart'
import chinaMapDefinition from './china-map'
import ganttChartDefinition from './gantt-chart'
import parallelChartDefinition from './parallel-chart'
import scrollTableDefinition from './scroll-table'
import wordCloudDefinition from './word-cloud'

/** 需要真实数据集绑定的组件定义：槽位 key → 是否多选 */
const BOUND_DEFINITIONS = [
  {
    def: bar3dChartDefinition,
    slots: { categoryField: false, seriesField: false, valueField: false },
  },
  {
    def: bubbleChartDefinition,
    slots: { xField: false, yField: false, sizeField: false },
  },
  {
    def: chinaMapDefinition,
    slots: { nameField: false, valueField: false },
  },
  {
    def: ganttChartDefinition,
    slots: { nameField: false, startField: false, endField: false, progressField: false },
  },
  {
    def: parallelChartDefinition,
    slots: { dimensionFields: true },
  },
  {
    def: wordCloudDefinition,
    slots: { nameField: false, valueField: false },
  },
] as const

describe('可视化组件数据绑定定义', () => {
  it.each(BOUND_DEFINITIONS.map((item) => [item.def.type, item] as const))(
    '%s 声明数据绑定与字段槽位',
    (type, { def, slots }) => {
      expect(def.supportsDataBinding).toBe(true)

      const schema = def.dataBindingSchema ?? []
      for (const [key, multiple] of Object.entries(slots)) {
        const slot = schema.find((s) => s.key === key)
        expect(slot, `${type} 缺少槽位 ${key}`).toBeTruthy()
        expect(Boolean(slot?.multiple)).toBe(multiple)
      }
    },
  )

  it('scroll-table 支持数据绑定且自动展示全部字段（无需手工映射槽位）', () => {
    expect(scrollTableDefinition.supportsDataBinding).toBe(true)
    expect(scrollTableDefinition.dataBindingSchema?.length ?? 0).toBe(0)
  })
})

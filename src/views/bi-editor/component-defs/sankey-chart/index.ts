import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

/** 🔑 桑基图默认真实数据（节点 + 流向） */
export const SANKEY_DEFAULT_NODES = [
  { name: '收入' },
  { name: '支出' },
  { name: '工资', value: 8000 },
  { name: '奖金', value: 3000 },
  { name: '房租', value: 3000 },
  { name: '餐饮', value: 2000 },
  { name: '储蓄', value: 4000 },
  { name: '其他', value: 2000 },
]

export const SANKEY_DEFAULT_LINKS = [
  { source: '工资', target: '收入', value: 8000 },
  { source: '奖金', target: '收入', value: 3000 },
  { source: '收入', target: '支出', value: 5000 },
  { source: '收入', target: '储蓄', value: 4000 },
  { source: '收入', target: '其他', value: 2000 },
  { source: '支出', target: '房租', value: 3000 },
  { source: '支出', target: '餐饮', value: 2000 },
]

export const sankeyChartDefinition: ComponentDefinition = {
  type: 'sankey-chart',
  meta: {
    name: '桑基图',
    category: 'chart',
    icon: 'Connection',
    defaultWidth: 500,
    defaultHeight: 300,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    {
      key: 'nodeWidth',
      label: '节点宽度',
      type: 'slider',
      min: 5,
      max: 30,
      default: 15,
      group: '节点',
    },
    {
      key: 'nodeGap',
      label: '节点间距',
      type: 'slider',
      min: 2,
      max: 30,
      default: 10,
      group: '节点',
    },
    {
      key: 'linkColor',
      label: '连线颜色',
      type: 'colorpicker',
      default: '#22d3ee',
      group: '连线',
    },
    {
      key: 'linkOpacity',
      label: '连线透明度',
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      group: '连线',
    },
  ],
  extraDefaults: {
    nodes: SANKEY_DEFAULT_NODES,
    links: SANKEY_DEFAULT_LINKS,
  },
  defaultStyle: {},
}

export default sankeyChartDefinition

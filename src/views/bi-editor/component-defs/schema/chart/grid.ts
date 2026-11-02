import type { PropField } from '../props'

/** 🔑 图表画布内边距配置 Schema（chartCommonSchema 的「画布内边距」分组） */
export const chartGridSchema: PropField[] = [
  // ============ Grid 画布内边距 ============
  {
    key: 'gridLeft',
    label: '左边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 40,
    group: '画布内边距',
  },
  {
    key: 'gridRight',
    label: '右边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 20,
    group: '画布内边距',
  },
  {
    key: 'gridTop',
    label: '上边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 40,
    group: '画布内边距',
  },
  {
    key: 'gridBottom',
    label: '下边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 30,
    group: '画布内边距',
  },
  {
    key: 'gridContainLabel',
    label: '包含刻度标签',
    type: 'switch',
    default: true,
    group: '画布内边距',
  },
]

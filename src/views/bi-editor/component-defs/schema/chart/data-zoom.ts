import type { PropField } from '../props'

/** 🔑 数据区域缩放配置 Schema（chartAxesSchema 的「数据缩放」分组） */
export const chartDataZoomSchema: PropField[] = [
  // ============ 数据区域缩放 DataZoom ============
  { key: 'dataZoomShow', label: '启用数据缩放', type: 'switch', default: false, group: '数据缩放' },
  {
    key: 'dataZoomType',
    label: '缩放类型',
    type: 'select',
    options: [
      { label: '内置（鼠标滚轮/手势）', value: 'inside' },
      { label: '滑动条组件', value: 'slider' },
    ],
    default: 'inside',
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomOrient',
    label: '方向',
    type: 'select',
    options: [
      { label: '水平', value: 'horizontal' },
      { label: '垂直', value: 'vertical' },
    ],
    default: 'horizontal',
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomStart',
    label: '起始百分比',
    type: 'slider',
    min: 0,
    max: 100,
    default: 0,
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomEnd',
    label: '结束百分比',
    type: 'slider',
    min: 0,
    max: 100,
    default: 100,
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
]

import type { PropField } from '../props'

/**
 * 🔑 图表注释：在图上叠加文本注释或标记点。
 *
 *   - 文本注释：通过 graphic 定位到画布百分比位置，所有图表可用；
 *   - 标记点：markPoint 挂到第一个 bar/line/scatter 系列，用于标注峰值/目标值。
 */
export const chartAnnotationSchema: PropField[] = [
  {
    key: 'annotationShow',
    label: '显示注释',
    type: 'switch',
    default: false,
    group: '注释',
    tip: '在图表上叠加文本注释或数据标记点',
  },
  {
    key: 'annotationType',
    label: '注释类型',
    type: 'select',
    default: 'markPoint',
    group: '注释',
    visibleWhen: { field: 'annotationShow', truthy: true },
    options: [
      { label: '标记点', value: 'markPoint' },
      { label: '文本注释', value: 'text' },
    ],
  },
  {
    key: 'annotationText',
    label: '注释文本',
    type: 'input',
    default: '',
    placeholder: '如：本月峰值',
    group: '注释',
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationValue',
    label: '标记值(标记点)',
    type: 'number',
    default: 0,
    step: 1,
    group: '注释',
    visibleWhen: { field: 'annotationShow', truthy: true },
    tip: '标记点定位到 Y 轴该数值；0 表示自动标记该系列最大值',
  },
  {
    key: 'annotationLeft',
    label: '水平位置%(文本)',
    type: 'number',
    default: 70,
    min: 0,
    max: 100,
    step: 1,
    group: '注释',
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationTop',
    label: '垂直位置%(文本)',
    type: 'number',
    default: 12,
    min: 0,
    max: 100,
    step: 1,
    group: '注释',
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationColor',
    label: '注释颜色',
    type: 'colorpicker',
    default: '#ef4444',
    group: '注释',
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationFontSize',
    label: '注释字号',
    type: 'number',
    default: 12,
    min: 8,
    max: 32,
    step: 1,
    group: '注释',
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
]

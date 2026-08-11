import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const imageDefinition: ComponentDefinition = {
  type: 'image',
  meta: {
    name: '图片',
    category: 'basic',
    icon: 'Picture',
    defaultWidth: 160,
    defaultHeight: 120,
  },
  widget: Widget,
  propsSchema: [
    { key: 'src', label: '图片地址', type: 'input', default: '', placeholder: '请输入图片 URL' },
    { key: 'alt', label: '替代文本', type: 'input', default: '' },
    {
      key: 'objectFit',
      label: '填充方式',
      type: 'select',
      options: [
        { label: '拉伸填充', value: 'fill' },
        { label: '包含（保持比例完整显示）', value: 'contain' },
        { label: '覆盖（保持比例裁剪）', value: 'cover' },
        { label: '不处理', value: 'none' },
        { label: '等比缩小', value: 'scale-down' },
      ],
      default: 'contain',
    },
    { key: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 50, default: 0 },
  ],
  defaultStyle: {},
}

export default imageDefinition

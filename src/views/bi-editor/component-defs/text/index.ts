import type { ComponentDefinition } from '../types'
import { textBaseSchema } from '../types'
import Widget from './Widget.vue'

export const textDefinition: ComponentDefinition = {
  type: 'text',
  meta: {
    name: '文本',
    category: 'basic',
    icon: 'Document',
    defaultWidth: 120,
    defaultHeight: 40,
  },
  widget: Widget,
  propsSchema: textBaseSchema,
  defaultStyle: {},
}

export default textDefinition

import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { textBaseSchema } from '../types'

export const textDefinition: ComponentDefinition = {
  type: 'text',
  meta: {
    name: '文本',
    category: 'basic',
    icon: 'Document',
    defaultWidth: 120,
    defaultHeight: 40,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: textBaseSchema,
  defaultStyle: {},
}

export default textDefinition

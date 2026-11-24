import type { ComponentDefinition } from '../types'
import { textBaseSchema } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const textDefinition: ComponentDefinition = {
  type: 'text',
  meta: {
    get name() {
      return t('editorMaterial.ui.text')
    },
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

import { defineAsyncComponent } from 'vue'
import { aggregatePropField, type ComponentDefinition } from '../types'

export const gaugeDefinition: ComponentDefinition = {
  type: 'gauge',
  meta: { name: '仪表盘', category: 'info', icon: 'Odometer', defaultWidth: 200, defaultHeight: 200 },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    { key: 'value', label: '当前值', type: 'slider', min: 0, max: 100, default: 50 },
    { key: 'max', label: '最大值', type: 'number', default: 100 },
    { key: 'min', label: '最小值', type: 'number', default: 0 },
    { key: 'color', label: '颜色', type: 'colorpicker', default: '#409EFF' },
    aggregatePropField,
  ],
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'valueField', label: '数值字段', type: 'value' },
  ],
}

export default gaugeDefinition

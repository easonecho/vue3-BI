import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { ElInput, ElInputNumber, ElColorPicker, ElSelect, ElOption, ElSwitch } from 'element-plus'
import type { TableColumnSchema } from '@/views/bi-editor/component-defs/types'

/**
 * 🔑 Element Plus 组件是 DefineComponent，其 props 为严格的联合类型；
 *   这里用对象字面量按字段动态拼装 props，与 h() 的 props 参数推断不兼容，
 *   统一收窄为 Vue 通用 Component 接口（h 的 RawProps 为宽松对象），
 *   避免在每个 h() 调用上重复写 `as any`。
 */
const EP = {
  input: ElInput as unknown as Component,
  number: ElInputNumber as unknown as Component,
  colorPicker: ElColorPicker as unknown as Component,
  select: ElSelect as unknown as Component,
  option: ElOption as unknown as Component,
  switch: ElSwitch as unknown as Component,
}

/** 表格单元格编辑器：按列类型渲染不同控件 */
export const TableCellEditor = defineComponent({
  name: 'TableCellEditor',
  props: {
    row: { type: Object as () => Record<string, any>, required: true },
    col: { type: Object as () => TableColumnSchema, required: true },
    index: { type: Number, required: true },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const updateVal = (v: any) => {
      /** 只上报新值，由父组件负责写回，避免子组件直接修改 props */
      emit('change', v)
    }
    return () => {
      const c = props.col
      const v = props.row[c.key]
      const commonStyle = { width: '100%' }
      // 🔑 事件必须放在第二个参数（props 对象）里，不能放在第三个参数（slots位置）
      if (c.type === 'input')
        return h(EP.input, {
          modelValue: v,
          placeholder: c.placeholder,
          size: 'small',
          style: commonStyle,
          'onUpdate:modelValue': updateVal,
        })
      if (c.type === 'number')
        return h(EP.number, {
          modelValue: v,
          min: c.min,
          max: c.max,
          step: c.step ?? 1,
          size: 'small',
          controlsPosition: 'right',
          style: commonStyle,
          'onUpdate:modelValue': updateVal,
        })
      if (c.type === 'colorpicker')
        return h(EP.colorPicker, {
          modelValue: v || '#ffffff',
          size: 'small',
          style: commonStyle,
          'onUpdate:modelValue': (nv: string | null) => updateVal(nv ?? ''),
        })
      if (c.type === 'select') {
        const children = (c.options || []).map((o) =>
          h(EP.option, { key: String(o.value), label: o.label, value: o.value }),
        )
        return h(
          EP.select,
          { modelValue: v, size: 'small', style: commonStyle, 'onUpdate:modelValue': updateVal },
          { default: () => children },
        )
      }
      if (c.type === 'switch')
        return h(EP.switch, {
          modelValue: v,
          size: 'small',
          'onUpdate:modelValue': updateVal,
        })
      return null
    }
  },
})

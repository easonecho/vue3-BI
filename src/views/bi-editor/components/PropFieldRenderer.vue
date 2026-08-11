<template>
  <div
    v-if="visible"
    :class="[
      'form-item',
      { 'form-item--inline': field.type === 'switch' || field.type === 'colorpicker' },
    ]"
  >
    <label>{{ field.label }}</label>

    <!-- 文本输入 -->
    <el-input
      v-if="field.type === 'input'"
      :model-value="modelValue"
      :placeholder="field.placeholder"
      @update:model-value="(v: string) => emit('update:modelValue', v)"
    />

    <!-- 多行文本 -->
    <el-input
      v-else-if="field.type === 'textarea'"
      type="textarea"
      :model-value="modelValue"
      :rows="3"
      :placeholder="field.placeholder"
      @update:model-value="(v: string) => emit('update:modelValue', v)"
    />

    <!-- 数字输入 -->
    <el-input-number
      v-else-if="field.type === 'number'"
      :model-value="modelValue"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      controls-position="right"
      @update:model-value="(v: number | undefined) => emit('update:modelValue', v)"
    />

    <!-- 滑块 -->
    <el-slider
      v-else-if="field.type === 'slider'"
      :model-value="modelValue"
      :min="field.min ?? 0"
      :max="field.max ?? 100"
      :step="field.step ?? 1"
      @update:model-value="(v: number | number[]) => emit('update:modelValue', v)"
    />

    <!-- 颜色选择 -->
    <el-color-picker
      v-else-if="field.type === 'colorpicker'"
      :model-value="modelValue || '#ffffff'"
      @update:model-value="(v: string | null) => emit('update:modelValue', v ?? '')"
    />

    <!-- 下拉选择 -->
    <el-select
      v-else-if="field.type === 'select'"
      :model-value="modelValue"
      @update:model-value="(v: any) => emit('update:modelValue', v)"
    >
      <el-option
        v-for="opt in field.options || []"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <!-- 开关 -->
    <el-switch
      v-else-if="field.type === 'switch'"
      :model-value="modelValue"
      @update:model-value="(v: string | number | boolean) => emit('update:modelValue', v)"
    />

    <!-- 🔑 表格：可编辑列表，用户按每一项数据单独配置样式（series 每个数据项的颜色/线宽等） -->
    <div v-else-if="field.type === 'table'" class="table-editor">
      <div class="table-toolbar">
        <el-button size="small" type="primary" plain @click="addTableRow">新增行</el-button>
        <el-button size="small" type="danger" plain :disabled="!hasRows" @click="removeLastRow"
          >删除末行</el-button
        >
      </div>
      <div class="table-scroll">
        <el-table :data="tableValue" size="small" border stripe style="width: 100%">
          <el-table-column
            v-for="col in field.columns || []"
            :key="col.key"
            :label="col.label"
            :width="col.width"
          >
            <template #default="{ $index }">
              <TableCellEditor
                :row="tableValue[$index]"
                :col="col"
                :index="$index"
                @change="emitTable"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="56" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button size="small" link type="danger" @click="removeRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 未知类型 fallback -->
    <span v-else class="unsupported">不支持的控件类型: {{ field.type }}</span>

    <span v-if="field.tip" class="field-tip">{{ field.tip }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropField, TableColumnSchema } from '@/views/bi-editor/component-defs/types'
import { isFieldVisible } from '@/views/bi-editor/component-defs/types'

const props = defineProps<{
  field: PropField
  modelValue: any
  /** 当前组件的完整 props，用于 visibleWhen 条件判断 */
  allProps?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

/** 🔑 根据 visibleWhen 条件决定是否渲染 */
const visible = computed(() => isFieldVisible(props.field, props.allProps || {}))

/** 🔑 table 类型的行数据：局部状态，保持用户编辑中间态，外部 modelValue 变化时重新同步 */
const tableValue = ref<any[]>(Array.isArray(props.modelValue) ? [...props.modelValue] : [])

/** 同步外部 modelValue → 内部 tableValue：切组件、外部变了（组件切换/撤销重做）重新同步 */
watch(
  () => props.modelValue,
  (nv) => {
    const arr = Array.isArray(nv) ? nv : []
    /** 仅当外部数组引用整体替换时才重置（避免每次 emitTable 后又被外部覆盖回来） */
    if (nv !== tableValue.value && !shallowArrayEqual(arr, tableValue.value)) {
      tableValue.value = [...arr]
    }
  },
)

function shallowArrayEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

const hasRows = computed(() => tableValue.value.length > 0)

/** 根据 columns 的默认值构造一个新行 */
function buildEmptyRow(): Record<string, any> {
  const row: Record<string, any> = {}
  for (const col of props.field.columns || []) {
    if (col.type === 'number') row[col.key] = col.min ?? 0
    else if (col.type === 'colorpicker') row[col.key] = ''
    else if (col.type === 'switch') row[col.key] = false
    else if (col.type === 'select') row[col.key] = col.options?.[0]?.value ?? ''
    else row[col.key] = ''
  }
  return row
}

function addTableRow() {
  tableValue.value.push(buildEmptyRow())
  emitTable()
}

function removeLastRow() {
  if (tableValue.value.length > 0) {
    tableValue.value.pop()
    emitTable()
  }
}

function removeRow(idx: number) {
  tableValue.value.splice(idx, 1)
  emitTable()
}

function emitTable() {
  /** 整体替换数组引用，确保父组件（RightPanel）的 watch、Widget 的 deep watch 都能触发响应式更新 */
  emit('update:modelValue', [...tableValue.value])
}
</script>

<!-- 🔑 表格单元格编辑器：按列类型渲染不同控件（内联子组件避免 template 复杂） -->
<script lang="ts">
import { defineComponent, h } from 'vue'
import { ElInput, ElInputNumber, ElColorPicker, ElSelect, ElOption, ElSwitch } from 'element-plus'

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
      props.row[props.col.key] = v
      emit('change')
    }
    return () => {
      const c = props.col
      const v = props.row[c.key]
      const commonStyle = { width: '100%' }
      // 🔑 事件必须放在第二个参数（props 对象）里，不能放在第三个参数（slots位置）
      if (c.type === 'input')
        return h(ElInput as any, {
          modelValue: v,
          placeholder: c.placeholder,
          size: 'small',
          style: commonStyle,
          'onUpdate:modelValue': updateVal,
        })
      if (c.type === 'number')
        return h(ElInputNumber as any, {
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
        return h(ElColorPicker as any, {
          modelValue: v || '#ffffff',
          size: 'small',
          style: commonStyle,
          'onUpdate:modelValue': (nv: any) => updateVal(nv ?? ''),
        })
      if (c.type === 'select') {
        const children = (c.options || []).map((o) =>
          h(ElOption as any, { key: String(o.value), label: o.label, value: o.value }),
        )
        return h(
          ElSelect as any,
          { modelValue: v, size: 'small', style: commonStyle, 'onUpdate:modelValue': updateVal },
          { default: () => children },
        )
      }
      if (c.type === 'switch')
        return h(ElSwitch as any, {
          modelValue: v,
          size: 'small',
          'onUpdate:modelValue': updateVal,
        })
      return null
    }
  },
})
</script>

<style scoped lang="less">
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-item--inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.form-item label {
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.field-tip {
  font-size: 11px;
  color: var(--bi-text-muted, #6b7280);
}

.unsupported {
  font-size: 12px;
  color: var(--bi-text-muted, #6b7280);
  font-style: italic;
}

/* ===== table 编辑器样式 ===== */
.table-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.table-scroll {
  max-height: 280px;
  overflow: auto;
  border-radius: 6px;
}

.table-scroll :deep(.el-table) {
  background: var(--bi-input-bg, #374151);
}

.table-scroll :deep(.el-table th),
.table-scroll :deep(.el-table tr) {
  background: transparent;
  color: var(--bi-text-primary, #f3f4f6);
}

.table-scroll :deep(.el-table td),
.table-scroll :deep(.el-table th.is-leaf) {
  border-color: var(--bi-border-color, #4b5563);
}

.table-scroll :deep(.el-table__row--striped td.el-table__cell) {
  background: rgba(255, 255, 255, 0.02);
}

.table-scroll :deep(.el-table__cell) {
  padding: 6px 4px;
}

.table-scroll :deep(.el-input__wrapper),
.table-scroll :deep(.el-select .el-input__wrapper) {
  background: var(--bi-table-cell-bg, #1f2937);
  box-shadow: none;
}

.table-scroll :deep(.el-input-number) {
  width: 100%;
}
</style>

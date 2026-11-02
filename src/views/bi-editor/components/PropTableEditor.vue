<template>
  <div class="table-editor">
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
              @change="(v: any) => handleCellChange($index, col.key, v)"
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
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropField } from '@/views/bi-editor/component-defs/types'
import { TableCellEditor } from './PropTableCellEditor'

const props = defineProps<{
  field: PropField
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

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

/** 单元格编辑：替换整行对象而不是就地修改，避免直接改动父组件传入的 props 数据 */
function handleCellChange(index: number, key: string, value: any) {
  const row = tableValue.value[index]
  if (!row) return
  tableValue.value[index] = { ...row, [key]: value }
  emitTable()
}
</script>

<style scoped lang="less">
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

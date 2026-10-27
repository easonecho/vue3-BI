<template>
  <div class="widget-table" :style="containerStyle">
    <div class="widget-table__body">
      <vxe-table
        :data="displayRows"
        :height="tableHeight"
        :border="border"
        :stripe="stripe"
        :round="round"
        :show-header="showHeader"
        :show-footer="showSummary"
        :footer-method="footerMethod"
        :row-config="rowConfig"
        :sort-config="sortConfig"
        :cell-style="cellStyleFn"
        :header-cell-style="headerCellStyleFn"
        size="small"
        auto-resize
        @sort-change="handleSortChange"
      >
        <vxe-column
          v-for="col in columns"
          :key="col.key"
          :field="col.key"
          :title="col.title"
          :width="col.width"
          :align="col.align || align"
          :min-width="col.minWidth || 80"
          :sortable="sortable"
          :formatter="formatterFor(col.key)"
          show-overflow
        />
        <template #empty>
          <span class="widget-table__empty">暂无数据</span>
        </template>
      </vxe-table>
    </div>
    <div v-if="showPager" class="widget-table__pager">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalRows"
        layout="total, prev, pager, next"
        small
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useDatasetBinding } from '../../composables/useDatasetBinding'
import {
  ensureDatasetSemantics,
  formatSemanticValue,
  getFieldSemantic,
} from '../../composables/useDatasetSemantics'

const props = defineProps<{ comp: ComponentInstance }>()

// 🔑 语义层: 加载字段显示格式 (货币/百分比/小数位), 用于单元格格式化
onMounted(() => {
  void ensureDatasetSemantics()
})

/** 按字段语义格式渲染单元格; 未配置格式时保留原始展示 */
function formatterFor(key: string) {
  const def = getFieldSemantic(props.comp.dataSource.datasetId, key)
  if (!def?.format?.type) return undefined
  const format = def.format
  return (params: { cellValue: unknown }) => formatSemanticValue(params.cellValue, format)
}

interface TableColumn {
  key: string
  title: string
  width?: number
  minWidth?: number
  align?: 'left' | 'center' | 'right'
}

// 🔑 数据绑定:有 datasetId 时直接用数据集行数据,fields 自动生成列
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows: datasetRows, fields: datasetFields } = useDatasetBinding(dataSourceRef)

const columns = computed<TableColumn[]>(() => {
  if (props.comp.dataSource.datasetId && datasetFields.value.length > 0) {
    return datasetFields.value.map((f) => ({
      key: f,
      title: f,
      minWidth: 100,
      align: isNumericColumn(f) ? 'right' : undefined,
    }))
  }
  return props.comp.props?.columns || []
})

/** 原始行数据 (未排序/分页) */
const rawRows = computed<Record<string, unknown>[]>(() => {
  if (props.comp.dataSource.datasetId && datasetRows.value.length > 0) {
    return datasetRows.value as Record<string, unknown>[]
  }
  return (props.comp.props?.data || []) as Record<string, unknown>[]
})

// 🔑 表格交互: 列排序 / 分页 / 合计行
const sortState = ref<{ field: string; order: 'asc' | 'desc' | null }>({
  field: '',
  order: null,
})
const currentPage = ref(1)

const sortable = computed(() => (props.comp.props?.sortable ?? true) as boolean)
const pageSize = computed(() => Number(props.comp.props?.pageSize ?? 20))
const showSummary = computed(() => (props.comp.props?.showSummary ?? false) as boolean)
const sortConfig = computed(() => ({ remote: true, trigger: 'cell' as const }))

/** 单元格值转可比较类型: 数字优先, 空值返回空串 */
function toComparable(value: unknown): number | string {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  if (str === '') return ''
  const num = Number(str)
  return Number.isFinite(num) ? num : str
}

function compareValues(x: number | string, y: number | string): number {
  if (typeof x === 'number' && typeof y === 'number') return x - y
  return String(x).localeCompare(String(y), 'zh-CN')
}

/** 全量排序后再分页, 保证跨页排序正确 */
const sortedRows = computed(() => {
  const { field, order } = sortState.value
  if (!field || !order) return rawRows.value
  return [...rawRows.value].sort((a, b) => {
    const x = toComparable(a[field])
    const y = toComparable(b[field])
    // 空值始终排末尾
    if (x === '' && y === '') return 0
    if (x === '') return 1
    if (y === '') return -1
    const base = compareValues(x, y)
    return order === 'asc' ? base : -base
  })
})

const totalRows = computed(() => sortedRows.value.length)

const displayRows = computed(() => {
  const size = pageSize.value
  if (!size || size <= 0) return sortedRows.value
  const start = (currentPage.value - 1) * size
  return sortedRows.value.slice(start, start + size)
})

const showPager = computed(() => pageSize.value > 0 && totalRows.value > pageSize.value)

function handleSortChange(params: { field?: string; property?: string; order?: 'asc' | 'desc' | null }) {
  sortState.value = {
    field: params.field || params.property || '',
    order: params.order || null,
  }
  currentPage.value = 1
}

/** 合计行: 对数值列求和 (当前页) */
function footerMethod(params: { columns: { field?: string }[]; data: Record<string, unknown>[] }) {
  return [
    params.columns.map((col, index) => {
      if (index === 0) return '合计'
      if (!col.field) return ''
      const values = params.data
        .map((row) => Number(row[col.field as string]))
        .filter((num) => Number.isFinite(num))
      if (values.length === 0) return ''
      const sum = values.reduce((acc, cur) => acc + cur, 0)
      return Number.isInteger(sum) ? sum : Number(sum.toFixed(2))
    }),
  ]
}

/** 数据源列若有数值样本, 默认右对齐 */
function isNumericColumn(key: string): boolean {
  let checked = 0
  for (const row of rawRows.value.slice(0, 20)) {
    const value = row[key]
    if (value === null || value === undefined || value === '') continue
    if (typeof value === 'number') {
      checked += 1
      continue
    }
    if (typeof value === 'string' && Number.isFinite(Number(value.trim()))) {
      checked += 1
      continue
    }
    return false
  }
  return checked > 0
}

watch(rawRows, () => {
  currentPage.value = 1
})

watch(pageSize, () => {
  currentPage.value = 1
})

watch(totalRows, (total) => {
  const size = pageSize.value
  if (size <= 0) return
  const maxPage = Math.max(1, Math.ceil(total / size))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

watch(sortable, (value) => {
  if (!value) sortState.value = { field: '', order: null }
})

watch(
  () => columns.value.map((col) => col.key).join(','),
  () => {
    sortState.value = { field: '', order: null }
    currentPage.value = 1
  },
)

const tableHeight = computed(() => '100%')

const border = computed(() => (props.comp.props?.border ?? true) as boolean)
const stripe = computed(() => (props.comp.props?.stripe ?? true) as boolean)
const round = computed(() => (props.comp.props?.round ?? false) as boolean)
const showHeader = computed(() => (props.comp.props?.showHeader ?? true) as boolean)
const align = computed(() => (props.comp.props?.align || 'left') as 'left' | 'center' | 'right')

const rowConfig = computed(() => ({ isHover: true, isCurrent: true }))

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  padding: `${props.comp.props?.padding || '0px'}`,
  boxSizing: 'border-box' as const,
  fontSize: `${props.comp.props?.fontSize || 12}px`,
}))

function cellStyleFn() {
  return {
    fontSize: `${props.comp.props?.fontSize || 12}px`,
    color: props.comp.props?.color || '#374151',
  }
}

function headerCellStyleFn() {
  return {
    backgroundColor: props.comp.props?.headerBg || '#f9fafb',
    color: props.comp.props?.headerColor || '#374151',
    fontSize: `${props.comp.props?.headerFontSize || 12}px`,
    fontWeight: 600,
  }
}
</script>

<style scoped lang="less">
.widget-table {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 4px 6px 0;
    flex-shrink: 0;
  }

  :deep(.vxe-table) {
    width: 100%;
    height: 100%;
  }

  &__empty {
    color: #9ca3af;
    font-size: 14px;
  }
}
</style>

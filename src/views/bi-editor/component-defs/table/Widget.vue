<template>
  <div class="widget-table" :style="containerStyle">
    <vxe-table
      :data="rows"
      :height="tableHeight"
      :border="border"
      :stripe="stripe"
      :round="round"
      :show-header="showHeader"
      :row-config="rowConfig"
      :cell-style="cellStyleFn"
      :header-cell-style="headerCellStyleFn"
      size="small"
      auto-resize
    >
      <vxe-column
        v-for="col in columns"
        :key="col.key"
        :field="col.key"
        :title="col.title"
        :width="col.width"
        :align="col.align || align"
        :min-width="col.minWidth || 80"
        show-overflow
      />
      <template #empty>
        <span class="widget-table__empty">暂无数据</span>
      </template>
    </vxe-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useDatasetBinding } from '../../composables/useDatasetBinding'

const props = defineProps<{ comp: ComponentInstance }>()

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
    return datasetFields.value.map((f) => ({ key: f, title: f, minWidth: 100 }))
  }
  return props.comp.props?.columns || []
})
const rows = computed(() => {
  if (props.comp.dataSource.datasetId && datasetRows.value.length > 0) {
    return datasetRows.value
  }
  return props.comp.props?.data || []
})

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

<template>
  <div class="widget-description-list" :style="containerStyle">
    <div v-if="title" class="widget-description-list__title" :style="titleStyle">{{ title }}</div>
    <div class="widget-description-list__body" :style="bodyStyle">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="widget-description-list__cell"
        :class="{ 'is-striped': striped && idx % 2 === 1 }"
        :style="cellStyle(idx)"
      >
        <div class="widget-description-list__label" :style="labelStyle">{{ item.label }}</div>
        <div class="widget-description-list__value" :style="valueStyle">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useDatasetBinding } from '../../composables/useDatasetBinding'

interface DescItem {
  label: string
  value: string | number
}

const props = defineProps<{ comp: ComponentInstance }>()

// ============ 数据绑定：有数据集时按 labelField/valueField 映射 ============
const dataSourceRef = computed(() => props.comp.dataSource)
const { rows: datasetRows } = useDatasetBinding(dataSourceRef)

const labelField = computed(() => String(props.comp.dataConfig?.labelField ?? ''))
const valueField = computed(() => String(props.comp.dataConfig?.valueField ?? ''))

const items = computed<DescItem[]>(() => {
  // 数据集模式：从行数据按字段映射
  if (props.comp.dataSource.datasetId && datasetRows.value.length > 0) {
    return datasetRows.value.map((row) => ({
      label: String(row[labelField.value] ?? ''),
      value: row[valueField.value] as string | number,
    }))
  }
  // 静态模式：用 extraDefaults.items
  const raw = props.comp.props?.items
  return Array.isArray(raw) ? (raw as DescItem[]) : []
})

// ============ 字段读取 ============
const title = computed(() => props.comp.props?.title ?? '设备详情')
const columns = computed(() => {
  const c = Number(props.comp.props?.columns ?? 2)
  return Math.max(1, Math.min(4, c))
})
const bordered = computed(() => props.comp.props?.bordered ?? true)
const striped = computed(() => props.comp.props?.striped ?? false)
const labelWidth = computed(() => Number(props.comp.props?.labelWidth ?? 120))
const labelColor = computed(() => props.comp.props?.labelColor ?? '#6b7280')
const valueColor = computed(() => props.comp.props?.valueColor ?? '#1f2937')
const bgColor = computed(() => props.comp.props?.bgColor ?? '#fff')
const borderColor = computed(() => props.comp.props?.borderColor ?? '#e5e7eb')
const fontSize = computed(() => Number(props.comp.props?.fontSize ?? 14))
const titleColor = computed(() => props.comp.props?.titleColor ?? '#1f2937')
const titleFontSize = computed(() => Number(props.comp.props?.titleFontSize ?? 16))

// ============ 样式 ============
const containerStyle = computed(() => ({
  background: bgColor.value,
  fontSize: `${fontSize.value}px`,
}))

const titleStyle = computed(() => ({
  color: titleColor.value,
  fontSize: `${titleFontSize.value}px`,
  fontWeight: 'bold' as const,
}))

const bodyStyle = computed(() => ({
  display: 'grid' as const,
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  border: bordered.value ? `1px solid ${borderColor.value}` : 'none',
}))

const labelStyle = computed(() => ({
  color: labelColor.value,
  width: `${labelWidth.value}px`,
  flexShrink: 0,
}))

const valueStyle = computed(() => ({
  color: valueColor.value,
}))

// 单元格样式：边框 + 斑马纹底色
function cellStyle(idx: number) {
  const isLastRow = Math.floor(idx / columns.value) === Math.floor((items.value.length - 1) / columns.value)
  const isLastCol = (idx % columns.value) === columns.value - 1
  const styles: Record<string, string> = {}
  if (bordered.value) {
    styles.borderRight = isLastCol ? 'none' : `1px solid ${borderColor.value}`
    styles.borderBottom = isLastRow ? 'none' : `1px solid ${borderColor.value}`
  }
  return styles
}
</script>

<style scoped lang="less">
.widget-description-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  user-select: none;
  overflow: hidden;

  &__title {
    flex-shrink: 0;
    padding: 8px 12px;
  }

  &__body {
    flex: 1;
    overflow: auto;
  }

  &__cell {
    display: flex;
    align-items: stretch;
    min-height: 32px;

    &.is-striped {
      background: rgba(0, 0, 0, 0.02);
    }
  }

  &__label {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__value {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 6px 10px;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
}
</style>

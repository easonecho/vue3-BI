<template>
  <div class="filter-widget">
    <div v-if="props.title" class="filter-widget__title">{{ props.title }}</div>
    <el-select
      v-if="props.filterType === 'select'"
      v-model="selectedValue"
      :placeholder="props.placeholder"
      :loading="datasetBound && loading"
      :remote="datasetBound"
      :remote-method="handleRemoteSearch"
      :no-data-text="error || '暂无可选值'"
      filterable
      clearable
      style="width: 100%"
      @change="onFilterChange"
      @visible-change="onVisibleChange"
    >
      <el-option v-for="opt in optionList" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>
    <el-select
      v-else-if="props.filterType === 'multi-select'"
      v-model="selectedValues"
      multiple
      :placeholder="props.placeholder"
      :loading="datasetBound && loading"
      :remote="datasetBound"
      :remote-method="handleRemoteSearch"
      :no-data-text="error || '暂无可选值'"
      filterable
      clearable
      style="width: 100%"
      @change="onMultiFilterChange"
      @visible-change="onVisibleChange"
    >
      <el-option v-for="opt in optionList" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>
    <el-date-picker
      v-else-if="props.filterType === 'date'"
      v-model="selectedValue"
      type="date"
      :placeholder="props.placeholder"
      value-format="YYYY-MM-DD"
      style="width: 100%"
      @change="onFilterChange"
    />
    <el-date-picker
      v-else-if="props.filterType === 'date-range'"
      v-model="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始"
      end-placeholder="结束"
      value-format="YYYY-MM-DD"
      style="width: 100%"
      @change="onDateRangeChange"
    />
    <div v-if="datasetBound && (truncated || error)" class="filter-widget__hint">
      {{ error || '候选值过多，仅展示部分结果，可输入关键字搜索' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLinkageStore } from '@/stores/linkage'
import { useDatasetDistinct, toFilterOptions } from '../../composables/useDatasetDistinct'

const props = defineProps<{
  comp: any
  title?: string
  filterKey?: string
  filterType?: string
  placeholder?: string
  options?: string
}>()

const linkageStore = useLinkageStore()

/** 候选值单次拉取上限 (与后端默认值一致) */
const OPTION_LIMIT = 200

const selectedValue = ref<string | null>(null)
const selectedValues = ref<string[]>([])
const dateRange = ref<[string, string] | null>(null)

/** 数据集绑定: DataBindingPanel 写入 dataConfig.field; 未绑定则回退手写 filterKey */
const datasetId = computed(() => {
  const id = Number(props.comp?.dataSource?.datasetId || 0)
  return id > 0 ? id : null
})
const boundField = computed(() => String(props.comp?.dataConfig?.field || '').trim())
const effectiveKey = computed(() => boundField.value || props.filterKey || 'default')

const isSelect = computed(
  () => props.filterType === 'select' || props.filterType === 'multi-select',
)
const datasetBound = computed(() => Boolean(datasetId.value && boundField.value && isSelect.value))

const {
  values: distinctValues,
  truncated,
  loading,
  error,
  handleSearch,
  resetSearch,
} = useDatasetDistinct(datasetId, boundField, isSelect, OPTION_LIMIT)

/** 静态选项(未绑定数据集时使用) */
const parsedOptions = computed(() => {
  const text = props.options || ''
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':')
      if (idx > 0) {
        return { label: line.substring(0, idx).trim(), value: line.substring(idx + 1).trim() }
      }
      return { label: line, value: line }
    })
})

const optionList = computed(() =>
  datasetBound.value ? toFilterOptions(distinctValues.value) : parsedOptions.value,
)

function handleRemoteSearch(term: string) {
  if (datasetBound.value) handleSearch(term)
}

function onVisibleChange(visible: boolean) {
  // 关闭下拉时恢复默认候选值, 避免下一次打开仍停留在上次搜索结果
  if (!visible && datasetBound.value) resetSearch()
}

function onFilterChange(val: string | null) {
  linkageStore.setFilter(effectiveKey.value, val)
}

function onMultiFilterChange(vals: string[]) {
  // 多选: 拼接为逗号分隔, 后端 in 条件按逗号拆分
  linkageStore.setFilter(effectiveKey.value, vals.length > 0 ? vals.join(',') : null)
}

function onDateRangeChange(val: [string, string] | null) {
  const key = effectiveKey.value
  if (val) {
    linkageStore.setFilter(`${key}_start`, val[0])
    linkageStore.setFilter(`${key}_end`, val[1])
  } else {
    linkageStore.setFilter(`${key}_start`, null)
    linkageStore.setFilter(`${key}_end`, null)
  }
}

// 注册/更新联动订阅: 字段随数据集绑定变化时同步更新, 避免筛错图表
watch(
  effectiveKey,
  (key) => {
    if (key) linkageStore.subscribe(props.comp?.id || 'unknown', [key])
  },
  { immediate: true },
)
</script>

<style scoped lang="less">
.filter-widget {
  padding: 8px 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &__title {
    font-size: 13px;
    color: #606266;
    margin-bottom: 6px;
    font-weight: 500;
  }

  &__hint {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>

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
      <template v-if="allowSelectAll" #footer>
        <div class="filter-widget__bulk">
          <el-button link size="small" :disabled="optionList.length === 0" @click="selectAll">
            全选
          </el-button>
          <el-button link size="small" :disabled="optionList.length === 0" @click="invertSelection">
            反选
          </el-button>
          <el-button
            link
            size="small"
            :disabled="selectedValues.length === 0"
            @click="clearSelection"
          >
            清空
          </el-button>
        </div>
      </template>
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
      :shortcuts="dateShortcuts"
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

/** 是否显示多选全选/反选工具条 */
const allowSelectAll = computed(() => props.comp?.props?.allowSelectAll !== false)

/** 级联筛选: 用其他筛选器当前值缩小候选范围 */
const cascadeEnabled = computed(() => props.comp?.props?.cascade === true)
const cascadeKeys = computed(() =>
  String(props.comp?.props?.cascadeKeys || '')
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean),
)

const cascadeParams = computed<Record<string, unknown> | undefined>(() => {
  if (!cascadeEnabled.value || !datasetBound.value) return undefined
  const own = effectiveKey.value
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(linkageStore.filterValues)) {
    if (value === null || value === undefined || value === '') continue
    // 排除自身字段及其日期范围键, 避免自己过滤自己
    if (key === own || key.startsWith(`${own}_`)) continue
    // 配置了父字段时仅使用指定字段 (含其 _start/_end)
    if (cascadeKeys.value.length > 0) {
      const matched = cascadeKeys.value.some((k) => key === k || key.startsWith(`${k}_`))
      if (!matched) continue
    }
    result[key] = value
  }
  return Object.keys(result).length > 0 ? result : undefined
})

const {
  values: distinctValues,
  truncated,
  loading,
  error,
  handleSearch,
  resetSearch,
} = useDatasetDistinct(datasetId, boundField, isSelect, OPTION_LIMIT, cascadeParams)

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

function selectAll() {
  selectedValues.value = optionList.value.map((opt) => String(opt.value))
  onMultiFilterChange(selectedValues.value)
}

function invertSelection() {
  const current = new Set(selectedValues.value.map(String))
  selectedValues.value = optionList.value
    .map((opt) => String(opt.value))
    .filter((value) => !current.has(value))
  onMultiFilterChange(selectedValues.value)
}

function clearSelection() {
  selectedValues.value = []
  onMultiFilterChange([])
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

// ---- 相对日期 ----

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 根据预设返回相对区间 (每次调用都以当天为基准) */
function relativeRange(preset: string): [Date, Date] | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = (offset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return d
  }
  switch (preset) {
    case 'today':
      return [today, today]
    case 'yesterday':
      return [day(-1), day(-1)]
    case 'last7days':
      return [day(-6), today]
    case 'last30days':
      return [day(-29), today]
    case 'thisMonth':
      return [new Date(today.getFullYear(), today.getMonth(), 1), today]
    case 'lastMonth':
      return [
        new Date(today.getFullYear(), today.getMonth() - 1, 1),
        new Date(today.getFullYear(), today.getMonth(), 0),
      ]
    default:
      return null
  }
}

const dateShortcuts = [
  { text: '今天', value: () => relativeRange('today') || [] },
  { text: '昨天', value: () => relativeRange('yesterday') || [] },
  { text: '最近 7 天', value: () => relativeRange('last7days') || [] },
  { text: '最近 30 天', value: () => relativeRange('last30days') || [] },
  { text: '本月', value: () => relativeRange('thisMonth') || [] },
  { text: '上月', value: () => relativeRange('lastMonth') || [] },
]

/** 默认相对区间: 每次打开看板按当天滚动, 已有筛选值时不再覆盖 */
function applyDefaultRelative(key: string) {
  if (props.filterType !== 'date-range') return
  const preset = String(props.comp?.props?.defaultRelative || 'none')
  if (preset === 'none') return
  if (linkageStore.getFilter(`${key}_start`) || linkageStore.getFilter(`${key}_end`)) return
  const range = relativeRange(preset)
  if (!range) return
  const formatted: [string, string] = [formatDate(range[0]), formatDate(range[1])]
  dateRange.value = formatted
  linkageStore.setFilter(`${key}_start`, formatted[0])
  linkageStore.setFilter(`${key}_end`, formatted[1])
}

// 注册/更新联动订阅: 字段随数据集绑定变化时同步更新, 避免筛错图表
watch(
  effectiveKey,
  (key) => {
    if (key) linkageStore.subscribe(props.comp?.id || 'unknown', [key])
    applyDefaultRelative(key)
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

  &__bulk {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 4px 8px;
    border-top: 1px solid var(--el-border-color-lighter);
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

/**
 * 图表明细抽屉（drill-through）
 *
 * 按当前图表的所有过滤条件（全局筛选 / 联动 / 钻取）分页查询原始数据行。
 * 复用服务端分页接口，SQL 数据集不会一次性拉全量；公开分享页走匿名分页接口。
 */
<template>
  <el-drawer
    :model-value="visible"
    :title="drawerTitle"
    size="min(880px, 94vw)"
    append-to-body
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <div class="detail-body">
      <div class="detail-toolbar">
        <div class="detail-summary">
          <span class="detail-count">共 {{ countText }} 行</span>
          <el-tag
            v-for="label in visibleSummaries"
            :key="label"
            size="small"
            effect="plain"
            class="detail-filter-tag"
          >
            {{ label }}
          </el-tag>
          <el-tag v-if="hiddenFilterCount > 0" size="small" type="info" effect="plain">
            +{{ hiddenFilterCount }}
          </el-tag>
        </div>
        <el-button size="small" :loading="loading" @click="reload">刷新</el-button>
      </div>

      <el-alert
        v-if="error"
        class="detail-alert"
        type="error"
        :title="error"
        show-icon
        :closable="false"
      />
      <el-alert
        v-if="truncated"
        class="detail-alert"
        type="warning"
        title="数据量超过服务端物化上限，仅能查看部分明细"
        show-icon
        :closable="false"
      />

      <div class="detail-table">
        <el-table
          v-loading="loading"
          :data="rows"
          size="small"
          border
          height="100%"
          @sort-change="handleSortChange"
        >
          <el-table-column
            v-for="col in columns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="140"
            show-overflow-tooltip
            sortable="custom"
          >
            <template #default="{ row }">{{ formatCell(row[col]) }}</template>
          </el-table-column>
          <template #empty>
            <el-empty v-if="!loading" description="暂无明细数据" :image-size="60" />
          </template>
        </el-table>
      </div>

      <div class="detail-footer">
        <span class="detail-page">第 {{ page }} 页</span>
        <div class="detail-page-actions">
          <el-button size="small" :disabled="page <= 1 || loading" @click="goPage(page - 1)">
            上一页
          </el-button>
          <el-button size="small" :disabled="!hasMore || loading" @click="goPage(page + 1)">
            下一页
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DatasetPageParams, RowCondition } from '@/api/dataset'
import { fetchPublicDatasetPage } from '@/api/share'
import { getPublicDashboardContext } from '@/utils/public-dashboard-context'
import { summarizeDetailFilters } from '@/views/bi-editor/composables/drill-through'
import { requestDatasetPage } from '@/views/bi-editor/composables/dataset-batch'

const props = withDefaults(
  defineProps<{
    visible: boolean
    datasetId: number | null
    title?: string
    filters?: RowCondition[]
    /** 每页行数 */
    limit?: number
  }>(),
  {
    title: '',
    filters: () => [],
    limit: 50,
  },
)

const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const rows = ref<Record<string, unknown>[]>([])
const columns = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = computed(() => props.limit ?? 50)
const total = ref<number | null>(null)
const hasMore = ref(false)
const truncated = ref(false)
const sortState = ref<{ field: string; order: 'asc' | 'desc' } | null>(null)

/** 请求序号：快速翻页/关闭时丢弃过期响应 */
let requestSeq = 0

const drawerTitle = computed(() => (props.title ? `${props.title} · 数据明细` : '数据明细'))

const filterSummaries = computed(() => summarizeDetailFilters(props.filters ?? []))
const visibleSummaries = computed(() => filterSummaries.value.slice(0, 6))
const hiddenFilterCount = computed(() =>
  Math.max(0, filterSummaries.value.length - visibleSummaries.value.length),
)

const countText = computed(() => {
  if (total.value !== null) return String(total.value)
  const loaded = (page.value - 1) * pageSize.value + rows.value.length
  return hasMore.value ? `${loaded}+` : String(loaded)
})

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

async function load() {
  const datasetId = props.datasetId
  if (!datasetId) {
    rows.value = []
    columns.value = []
    error.value = ''
    total.value = null
    hasMore.value = false
    truncated.value = false
    return
  }

  const seq = ++requestSeq
  loading.value = true
  error.value = ''

  const params: DatasetPageParams = {
    offset: (page.value - 1) * pageSize.value,
    limit: pageSize.value,
    filters: props.filters ?? [],
    ...(sortState.value
      ? { sortBy: sortState.value.field, sortOrder: sortState.value.order }
      : {}),
  }

  try {
    const publicCtx = getPublicDashboardContext()
    const result = publicCtx
      ? (
          await fetchPublicDatasetPage(publicCtx.token, datasetId, {
            ...params,
            password: publicCtx.password,
          })
        ).data
      : await requestDatasetPage(datasetId, params)
    if (seq !== requestSeq) return

    rows.value = result.rows ?? []
    columns.value = result.columns ?? []
    hasMore.value = !!result.hasMore
    truncated.value = !!result.truncated
    total.value = typeof result.total === 'number' ? result.total : null
  } catch (e) {
    if (seq !== requestSeq) return
    error.value = e instanceof Error ? e.message : '明细加载失败'
    rows.value = []
    columns.value = []
    hasMore.value = false
    total.value = null
    truncated.value = false
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

function reload() {
  page.value = 1
  void load()
}

function goPage(next: number) {
  if (next < 1) return
  page.value = next
  void load()
}

function handleVisibleChange(value: boolean) {
  emit('update:visible', value)
}

function handleSortChange(payload: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!payload?.order || !payload.prop) {
    sortState.value = null
  } else {
    sortState.value = {
      field: payload.prop,
      order: payload.order === 'ascending' ? 'asc' : 'desc',
    }
  }
  reload()
}

watch(
  () => props.visible,
  (value) => {
    if (!value) {
      // 关闭后递增序号，避免迟到的响应覆盖下次打开的数据
      requestSeq++
      return
    }
    page.value = 1
    sortState.value = null
    void load()
  },
  { immediate: true },
)

watch(
  () => props.datasetId,
  () => {
    if (!props.visible) return
    page.value = 1
    sortState.value = null
    void load()
  },
)

watch(
  () => props.filters,
  () => {
    if (!props.visible) return
    page.value = 1
    void load()
  },
  { deep: true },
)
</script>

<style scoped lang="less">
:deep(.el-drawer__body) {
  padding: 0;
}

.detail-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px 16px;
  gap: 8px;
}

.detail-toolbar {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.detail-count {
  font-size: 12px;
  color: #6b7280;
}

.detail-filter-tag {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-alert {
  flex: 0 0 auto;
}

.detail-table {
  flex: 1 1 auto;
  min-height: 0;
}

.detail-footer {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}

.detail-page {
  font-size: 12px;
  color: #6b7280;
}

.detail-page-actions {
  display: flex;
  gap: 8px;
}
</style>

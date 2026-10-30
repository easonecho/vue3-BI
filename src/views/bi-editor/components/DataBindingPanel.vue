<template>
  <div v-if="store.selectedComponent" class="data-section">
    <div v-if="currentDefinition?.supportsDataBinding" class="section">
      <!-- 数据集选择器 -->
      <div class="section-title">数据源</div>
      <div class="form-item">
        <label>数据集</label>
        <el-select
          :model-value="store.selectedComponent.dataSource.datasetId"
          placeholder="请选择数据集"
          filterable
          clearable
          :loading="datasetListLoading"
          @visible-change="handleDatasetSelectVisible"
          @update:model-value="handleDatasetChange"
        >
          <el-option
            v-for="item in datasetList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>

      <!-- 字段映射(根据 dataBindingSchema 动态渲染) -->
      <template v-if="store.selectedComponent.dataSource.datasetId">
        <div v-if="dataBindingFields.length > 0" class="section-title" style="margin-top: 16px">
          字段映射
        </div>
        <div v-if="dataBindingFields.length === 0" class="form-item">
          <span class="placeholder-text" style="padding: 8px 0">
            表格组件自动展示数据集全部字段,无需手动映射
          </span>
        </div>
        <div v-for="field in dataBindingFields" :key="field.key" class="form-item">
          <label>{{ field.label }}</label>
          <el-select
            :model-value="getFieldMapping(field.key)"
            :placeholder="`选择${field.label}`"
            :multiple="field.multiple"
            clearable
            @update:model-value="
              (v: string | string[] | null) => handleFieldMappingChange(field.key, v)
            "
          >
            <el-option
              v-for="opt in fieldOptions(field.type)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div v-if="semanticHint(field)" class="semantic-tip">
            <span>{{ semanticHint(field) }}</span>
            <el-button
              v-if="showApplyDefaultAggregate(field)"
              link
              type="primary"
              size="small"
              @click="applyDefaultAggregate(field)"
              >应用默认聚合</el-button
            >
          </div>
        </div>
      </template>

      <!-- 数据预览 -->
      <template v-if="store.selectedComponent.dataSource.datasetId">
        <div class="section-title" style="margin-top: 16px">
          数据预览
          <span v-if="datasetLoading" class="loading-hint">加载中...</span>
        </div>
        <div class="data-preview">
          <el-table v-if="previewRows.length > 0" :data="previewRows" size="small" border max-height="200">
            <el-table-column
              v-for="f in previewFields"
              :key="f"
              :prop="f"
              :label="f"
              min-width="100"
              show-overflow-tooltip
            />
          </el-table>
          <el-empty v-else-if="!datasetLoading" description="暂无数据" :image-size="40" />
        </div>
      </template>
    </div>

    <template v-else>
      <div class="placeholder-text">此组件不支持数据绑定</div>
    </template>
  </div>

  <el-empty v-else description="请选择组件配置数据" :image-size="100" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useBiEditorStore } from '@/stores/bi-editor'
import { getDefinition } from '@/views/bi-editor/component-defs'
import type { DataBindingField } from '@/views/bi-editor/component-defs/types'
import { getDatasetList, type DatasetField } from '@/api/dataset'
import { useDatasetBinding } from '../composables/useDatasetBinding'
import {
  AGGREGATE_LABELS,
  FORMAT_LABELS,
  ensureDatasetSemantics,
  getFieldSemantic,
  registerDatasetSemantics,
} from '../composables/useDatasetSemantics'
import type { Dataset } from '@/api/types'

const store = useBiEditorStore()

/** 当前组件定义（取 dataBindingSchema / supportsDataBinding） */
const currentDefinition = computed(() => {
  const type = store.selectedComponent?.type
  return type ? getDefinition(type) : undefined
})

/** 数据集列表 */
const datasetList = ref<Dataset[]>([])
const datasetListLoading = ref(false)
/** 已加载过列表标志(避免每次展开 select 都请求) */
let datasetListLoaded = false

async function loadDatasetList() {
  if (datasetListLoaded) return
  datasetListLoading.value = true
  try {
    const res = await getDatasetList({ page: 1, pageSize: 100 })
    datasetList.value = res.data.list ?? []
    // 复用列表数据注册语义层元数据, 避免编辑器额外请求
    registerDatasetSemantics(datasetList.value)
    datasetListLoaded = true
  } finally {
    datasetListLoading.value = false
  }
}

/** 下拉展开时懒加载数据集列表 */
function handleDatasetSelectVisible(visible: boolean) {
  if (visible) loadDatasetList()
}

/** 当前组件的数据绑定字段 schema(从组件定义读取) */
const dataBindingFields = computed<DataBindingField[]>(() => {
  return currentDefinition.value?.dataBindingSchema ?? []
})

/** 当前组件绑定的数据集 dataSource ref(供 useDatasetBinding 取数) */
const currentDataSource = computed(() => {
  return store.selectedComponent?.dataSource ?? { datasetId: null }
})

/** 面板自己也用 useDatasetBinding 取一份数据(用于字段映射下拉选项 + 数据预览)。
 *   与 Widget 内部的 useDatasetBinding 共享模块级缓存,不会重复请求 */
const {
  rows: datasetRows,
  fields: datasetFields,
  loading: datasetLoading,
} = useDatasetBinding(currentDataSource)

/** 预览数据(前 5 行) */
const previewRows = computed(() => datasetRows.value.slice(0, 5))
const previewFields = computed(() => datasetFields.value)

/** 切换数据集 */
function handleDatasetChange(datasetId: number | null) {
  if (!store.selectedId) return
  store.updateComponent(store.selectedId, {
    dataSource: { datasetId },
    // 🔑 切换数据集时清空字段映射,避免旧字段名残留
    dataConfig: {},
  })
}

/** 读取字段映射值 */
function getFieldMapping(key: string): string | string[] | undefined {
  const config = store.selectedComponent?.dataConfig as Record<string, unknown> | undefined
  return config?.[key] as string | string[] | undefined
}

/** 更新字段映射 */
function handleFieldMappingChange(key: string, value: string | string[] | null) {
  if (!store.selectedId || !store.selectedComponent) return
  store.updateComponent(store.selectedId, {
    dataConfig: { ...store.selectedComponent.dataConfig, [key]: value ?? undefined },
  })
}

/** 更新组件 props（应用默认聚合用） */
function updateProp(key: string, value: unknown) {
  if (!store.selectedId) return
  const comp = store.selectedComponent
  if (!comp) return
  store.updateComponent(store.selectedId, {
    props: { ...comp.props, [key]: value },
  })
}

// ====== 语义层 (字段角色/默认聚合/显示格式) ======

/** 当前组件绑定数据集的字段语义 */
function semanticDefOf(fieldName: string): DatasetField | undefined {
  return getFieldSemantic(store.selectedComponent?.dataSource?.datasetId, fieldName)
}

/** 字段映射下拉选项: 按槽位类型排序 (数值槽度量优先), 并附带语义标签 */
function fieldOptions(slotType: DataBindingField['type']) {
  const rankOf = slotType === 'value' ? { measure: 0, dimension: 1 } : { dimension: 0, measure: 1 }
  return datasetFields.value
    .map((name) => {
      const def = semanticDefOf(name)
      const tags: string[] = []
      if (def?.role) tags.push(def.role === 'measure' ? '度量' : '维度')
      if (def?.format?.type && FORMAT_LABELS[def.format.type]) tags.push(FORMAT_LABELS[def.format.type])
      return {
        value: name,
        label: tags.length ? `${name} (${tags.join(' · ')})` : name,
        rank: def?.role ? rankOf[def.role] : 2,
      }
    })
    .sort((a, b) => a.rank - b.rank)
}

/** 已选字段的语义提示文案 */
function semanticHint(slot: DataBindingField): string {
  const value = getFieldMapping(slot.key)
  if (typeof value !== 'string' || !value) return ''
  const def = semanticDefOf(value)
  if (!def) return ''
  const parts: string[] = []
  if (def.role) parts.push(def.role === 'measure' ? '度量' : '维度')
  if (def.defaultAggregate && def.defaultAggregate !== 'none') {
    parts.push(`默认聚合: ${AGGREGATE_LABELS[def.defaultAggregate] ?? def.defaultAggregate}`)
  }
  if (def.format?.type && FORMAT_LABELS[def.format.type]) {
    parts.push(`格式: ${FORMAT_LABELS[def.format.type]}`)
  }
  return parts.join(' · ')
}

/** 语义层默认聚合与当前图表聚合方式不一致时, 提示可一键应用 */
function showApplyDefaultAggregate(slot: DataBindingField): boolean {
  if (slot.type !== 'value') return false
  const value = getFieldMapping(slot.key)
  if (typeof value !== 'string' || !value) return false
  const def = semanticDefOf(value)
  if (!def?.defaultAggregate || def.defaultAggregate === 'none') return false
  const current = String(store.selectedComponent?.props?.aggregate ?? '')
  return current !== def.defaultAggregate
}

/** 应用字段语义层的默认聚合方式到图表的聚合属性 */
function applyDefaultAggregate(slot: DataBindingField) {
  const value = getFieldMapping(slot.key)
  const def = typeof value === 'string' ? semanticDefOf(value) : undefined
  if (!def?.defaultAggregate || def.defaultAggregate === 'none') return
  updateProp('aggregate', def.defaultAggregate)
  ElMessage.success(`已应用默认聚合: ${AGGREGATE_LABELS[def.defaultAggregate] ?? def.defaultAggregate}`)
}

/** 选中已绑定数据集的组件时, 预加载语义层元数据 (模块级只请求一次) */
watch(
  () => store.selectedComponent?.dataSource?.datasetId,
  (datasetId) => {
    if (datasetId) void ensureDatasetSemantics()
  },
  { immediate: true },
)
</script>

<style scoped lang="less">
/* 数据面板样式：从 RightPanel 抽出，保持视觉一致 */
.data-section .section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--bi-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--bi-border-color, #374151);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-item label {
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.placeholder-text {
  font-size: 13px;
  color: var(--bi-text-muted, #6b7280);
  text-align: center;
  padding: 20px;
}

.semantic-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--bi-text-muted, #9ca3af);
  line-height: 1.5;
}

.semantic-tip :deep(.el-button) {
  padding: 0;
  font-size: 12px;
}

.loading-hint {
  font-size: 12px;
  color: var(--bi-accent, #409eff);
  margin-left: 8px;
  font-weight: normal;
}

.data-preview {
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.data-preview .el-table) {
  background: var(--bi-input-bg, #374151);
  color: var(--bi-text-primary, #f3f4f6);
  font-size: 12px;
}

:deep(.data-preview .el-table th.el-table__cell) {
  background: var(--bi-panel-header-bg, #111827);
  color: var(--bi-text-secondary, #9ca3af);
  border-color: var(--bi-border-color, #374151);
}

:deep(.data-preview .el-table td.el-table__cell) {
  border-color: var(--bi-border-color, #374151);
}

:deep(.data-preview .el-table__empty-text) {
  color: var(--bi-text-muted, #6b7280);
}
</style>

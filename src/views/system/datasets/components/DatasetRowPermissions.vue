<template>
  <el-dialog
    v-model="visible"
    :title="
      dataset
        ? t('datasetPage.rowPermission.titleWithName', { name: dataset.name })
        : t('datasetPage.rowPermission.title')
    "
    width="880px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="rls-toolbar">
      <el-button type="primary" size="small" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('datasetPage.rowPermission.add') }}
      </el-button>
      <span class="rls-hint">
        {{ t('datasetPage.rowPermission.hint') }}
      </span>
    </div>

    <el-table v-loading="loading" :data="rules" size="small" border>
      <el-table-column
        prop="name"
        :label="t('datasetPage.rowPermission.colName')"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column :label="t('datasetPage.rowPermission.colSubject')" width="190">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ subjectLabel(row, options) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.rowPermission.colConditions')" min-width="260">
        <template #default="{ row }">
          <span class="cond-text">{{ conditionsLabel(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="priority"
        :label="t('datasetPage.rowPermission.colPriority')"
        width="80"
        align="center"
      />
      <el-table-column :label="t('datasetPage.rowPermission.colEnabled')" width="80" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" size="small" @change="toggleEnabled(row)" />
        </template>
      </el-table-column>
      <el-table-column
        :label="t('datasetPage.rowPermission.colActions')"
        width="120"
        align="center"
      >
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">{{
            t('common.edit')
          }}</el-button>
          <el-popconfirm
            :title="t('datasetPage.rowPermission.deleteConfirm')"
            confirm-button-type="danger"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button link type="danger" size="small">{{ t('common.delete') }}</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && rules.length === 0"
      :description="t('datasetPage.rowPermission.empty')"
      :image-size="60"
    />

    <!-- 新增/编辑规则 -->
    <DatasetRowPermissionFormDialog
      v-if="dataset"
      v-model="formVisible"
      :dataset-id="dataset.id"
      :options="options"
      :rule="editingRule"
      @saved="handleFormSaved"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import type { RowPermission } from '@/api/dataset'
import DatasetRowPermissionFormDialog from './DatasetRowPermissionFormDialog.vue'
import { useDatasetRowPermissions } from '../composables/useDatasetRowPermissions'
import { conditionsLabel, subjectLabel } from '../utils/row-permission-utils'

const props = defineProps<{
  modelValue: boolean
  dataset: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  saved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const formVisible = ref(false)
const editingRule = ref<RowPermission | null>(null)

const { t } = useI18n()

const { rules, loading, options, handleClosed, toggleEnabled, handleDelete, loadRules } =
  useDatasetRowPermissions({
    dataset: () => props.dataset,
    visible: () => props.modelValue,
    onSaved: () => emit('saved'),
  })

function openCreate() {
  editingRule.value = null
  formVisible.value = true
}

function openEdit(rule: RowPermission) {
  editingRule.value = rule
  formVisible.value = true
}

async function handleFormSaved() {
  await loadRules()
  emit('saved')
}
</script>

<style scoped lang="less">
.rls-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.rls-hint {
  color: #9ca3af;
  font-size: 12px;
}
.cond-text {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  color: #374151;
}
</style>

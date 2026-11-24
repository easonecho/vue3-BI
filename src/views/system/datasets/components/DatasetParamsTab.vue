<template>
  <div>
    <div style="margin-bottom: 12px">
      <el-button type="primary" size="small" @click="addParam">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('datasetPage.params.add') }}
      </el-button>
      <span style="margin-left: 12px; color: #6b7280; font-size: 13px">
        {{ t('datasetPage.params.hint', { paramName: PARAM_REF }) }}
      </span>
    </div>
    <el-table :data="params" size="small" border>
      <el-table-column :label="t('datasetPage.params.colName')" width="140">
        <template #default="{ row }">
          <el-input
            v-model="row.name"
            size="small"
            :placeholder="t('datasetPage.params.namePlaceholder')"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.params.colLabel')" width="120">
        <template #default="{ row }">
          <el-input
            v-model="row.label"
            size="small"
            :placeholder="t('datasetPage.params.labelPlaceholder')"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.params.colType')" width="120">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small" style="width: 100%">
            <el-option :label="t('datasetPage.fieldType.string')" value="string" />
            <el-option :label="t('datasetPage.fieldType.number')" value="number" />
            <el-option :label="t('datasetPage.fieldType.date')" value="date" />
            <el-option :label="t('datasetPage.fieldType.datetime')" value="datetime" />
            <el-option :label="t('datasetPage.fieldType.boolean')" value="boolean" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.params.colDefault')" width="140">
        <template #default="{ row }">
          <el-input
            v-model="row.defaultValue"
            size="small"
            :placeholder="t('datasetPage.params.defaultValuePlaceholder')"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.params.colRequired')" width="80" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.required" size="small" />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.params.colActions')" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="removeParam($index)">{{
            t('common.delete')
          }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="params.length === 0"
      :description="t('datasetPage.params.empty')"
      :image-size="60"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import type { DatasetParam } from '@/api/dataset'

const { t } = useI18n()

/** SQL 参数引用示例（避免在模板表达式中直接书写双大括号） */
const PARAM_REF = '{{ paramName }}'

/** 参数列表 (与父级 form.params 双向绑定) */
const params = defineModel<DatasetParam[]>('params', { default: () => [] })

function addParam() {
  params.value = [
    ...params.value,
    { name: '', label: '', type: 'string', defaultValue: '', required: false },
  ]
}

function removeParam(idx: number) {
  const next = [...params.value]
  next.splice(idx, 1)
  params.value = next
}
</script>

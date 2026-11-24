<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? t('datasetPage.edit.createTitle') : t('datasetPage.edit.editTitle')"
    width="1000px"
    destroy-on-close
    @open="onOpen"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="t('datasetPage.edit.tabBasic')" name="basic">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item :label="t('datasetPage.edit.nameLabel')" prop="name">
            <el-input
              v-model="form.name"
              maxlength="100"
              :placeholder="t('datasetPage.edit.namePlaceholder')"
            />
          </el-form-item>
          <el-form-item v-if="form.type === 'file'" :label="t('datasetPage.edit.dataType')">
            <el-tag type="warning" size="small">{{ t('datasetPage.edit.fileDatasetTag') }}</el-tag>
          </el-form-item>
          <el-form-item v-else :label="t('datasetPage.edit.datasourceLabel')" prop="datasourceId">
            <el-select
              v-model="form.datasourceId"
              filterable
              :placeholder="t('datasetPage.edit.datasourcePlaceholder')"
              style="width: 100%"
            >
              <el-option
                v-for="d in dsOptions"
                :key="d.id"
                :label="`${d.name} (${d.type?.toUpperCase()})`"
                :value="d.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('datasetPage.edit.cacheLabel')" prop="cacheEnabled">
            <el-switch v-model="form.cacheEnabled" />
            <span style="margin-left: 12px; color: #6b7280; font-size: 13px">{{
              t('datasetPage.edit.cacheHint')
            }}</span>
          </el-form-item>
          <el-form-item :label="t('datasetPage.edit.cacheTtlLabel')" prop="cacheTtl">
            <el-input-number
              v-model="form.cacheTtl"
              :min="0"
              :max="86400"
              controls-position="right"
              style="width: 200px"
            />
            <span style="margin-left: 12px; color: #6b7280; font-size: 13px">{{
              t('datasetPage.edit.seconds')
            }}</span>
          </el-form-item>
          <el-form-item :label="t('datasetPage.edit.descriptionLabel')">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="2"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane
        v-if="form.type === 'file'"
        :label="t('datasetPage.edit.tabDatafile')"
        name="datafile"
      >
        <DatasetEditFileTab
          :dataset-id="form.id"
          :file-data="form.fileData"
          @update:file-data="form.fileData = $event"
          @saved="emit('saved')"
          @preview-dataset="emit('preview-dataset', $event)"
        />
      </el-tab-pane>

      <el-tab-pane v-else :label="t('datasetPage.edit.tabSql')" name="sql">
        <el-form :model="form" label-width="96px">
          <el-form-item :label="t('datasetPage.edit.sqlLabel')" prop="sql">
            <SqlEditor
              v-model="form.sql"
              :height="240"
              label="SQL"
              placeholder="SELECT col1, col2 FROM table_name WHERE col = {{paramName}} ..."
            />
            <div style="color: #9ca3af; font-size: 12px; margin-top: 4px">
              {{ t('datasetPage.edit.sqlHint', { paramName: PARAM_REF }) }}
            </div>
          </el-form-item>
        </el-form>
        <el-button :disabled="!(form.datasourceId && form.sql)" @click="previewCurrentForm">
          {{ t('datasetPage.edit.validateSql') }}
        </el-button>
      </el-tab-pane>

      <el-tab-pane :label="paramsTabLabel" name="params">
        <DatasetParamsTab v-model:params="form.params" />
      </el-tab-pane>

      <el-tab-pane
        v-if="form.type !== 'file'"
        :label="t('datasetPage.edit.tabExtract')"
        name="extract"
      >
        <DatasetExtractTab :mode="mode" :dataset-id="form.id" />
      </el-tab-pane>

      <el-tab-pane :label="fieldsTabLabel" name="fields">
        <DatasetFieldsTab
          v-model:fields="form.fields"
          :preview-columns="previewColumns"
          :preview-rows="previewRows"
        />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">{{
        t('datasetPage.confirm')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { createDataset, updateDataset } from '@/api/dataset'
import type { DataSource } from '@/api/types'
import SqlEditor from '@/components/SqlEditor.vue'
import DatasetParamsTab from './DatasetParamsTab.vue'
import DatasetFieldsTab from './DatasetFieldsTab.vue'
import DatasetEditFileTab from './DatasetEditFileTab.vue'
import DatasetExtractTab from './DatasetExtractTab.vue'
import {
  type DatasetEditForm,
  normalizeFieldForEdit,
  buildDatasetPayload,
} from '../utils/dataset-edit-utils'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  /** 编辑模式下的数据集行数据 */
  dataset: any
  dsOptions: DataSource[]
  /** 预览结果的列名 (用于字段自动检测/表达式校验) */
  previewColumns: string[]
  /** 预览结果的行数据 (用于字段语义推断) */
  previewRows: any[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 保存/替换成功后通知父级刷新列表 */
  saved: []
  /** 请求父级预览指定数据集 */
  'preview-dataset': [id: number]
  /** 请求父级校验并预览 SQL */
  'preview-sql': [params: { datasourceId: number; sql: string }]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const { t } = useI18n()

/** SQL 参数引用示例（避免在模板表达式中直接书写双大括号） */
const PARAM_REF = '{{ paramName }}'

const submitting = ref(false)
const formRef = ref<FormInstance>()
const activeTab = ref('basic')

const form = reactive<DatasetEditForm>({
  id: undefined,
  name: '',
  datasourceId: 0,
  sql: '',
  cacheEnabled: false,
  cacheTtl: 300,
  description: '',
  fields: [],
  params: [],
  type: 'sql',
  fileData: undefined,
})

/** 参数配置标签页文案 (含参数数量) */
const paramsTabLabel = computed(() =>
  form.params && form.params.length
    ? t('datasetPage.edit.tabParamsWithCount', { count: form.params.length })
    : t('datasetPage.edit.tabParams'),
)

/** 字段管理标签页文案 (含字段数量) */
const fieldsTabLabel = computed(() =>
  form.fields && form.fields.length
    ? t('datasetPage.edit.tabFieldsWithCount', { count: form.fields.length })
    : t('datasetPage.edit.tabFields'),
)

/** 动态校验规则: 文件数据集无需数据源/SQL */
const rules = computed<FormRules>(() => {
  const base: FormRules = {
    name: [
      { required: true, message: t('datasetPage.edit.nameRequired'), trigger: 'blur' },
      { max: 100, trigger: 'blur' },
    ],
    cacheTtl: [
      {
        type: 'number',
        min: 0,
        max: 86400,
        message: t('datasetPage.edit.ttlRange'),
        trigger: 'blur',
      },
    ],
  }
  if (form.type === 'file') return base
  base.datasourceId = [
    { required: true, message: t('datasetPage.edit.datasourceRequired'), trigger: 'change' },
  ]
  base.sql = [{ required: true, message: t('datasetPage.edit.sqlRequired'), trigger: 'blur' }]
  return base
})

/** 打开对话框时按 mode 初始化表单 */
function onOpen() {
  activeTab.value = 'basic'
  if (props.mode === 'create') {
    Object.assign(form, {
      id: undefined,
      name: '',
      datasourceId: props.dsOptions[0]?.id ?? 0,
      sql: '',
      cacheEnabled: false,
      cacheTtl: 300,
      description: '',
      fields: [],
      params: [],
      type: 'sql',
      fileData: undefined,
    })
    return
  }
  const row = props.dataset
  if (!row) return
  Object.assign(form, {
    id: row.id,
    name: row.name,
    datasourceId: row.datasourceId,
    sql: row.sql,
    cacheEnabled: !!row.cacheEnabled,
    cacheTtl: row.cacheTtl ?? 300,
    description: row.description ?? '',
    fields: Array.isArray(row.fields) ? row.fields.map(normalizeFieldForEdit) : [],
    params: Array.isArray(row.params) ? [...row.params] : [],
    type: row.type === 'file' ? 'file' : 'sql',
    fileData: row.fileData ?? undefined,
  })
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) {
    activeTab.value = 'basic'
    return
  }
  const isFile = form.type === 'file'
  if (!isFile && !form.sql) {
    activeTab.value = 'sql'
    ElMessage.warning(t('datasetPage.edit.sqlRequired'))
    return
  }
  submitting.value = true
  try {
    const payload = buildDatasetPayload(form, isFile)
    if (props.mode === 'create') {
      await createDataset(payload)
      ElMessage.success(t('datasetPage.edit.createSuccess'))
    } else if (form.id) {
      await updateDataset(form.id, payload)
      ElMessage.success(t('datasetPage.edit.saveSuccess'))
    }
    visible.value = false
    emit('saved')
  } finally {
    submitting.value = false
  }
}

// ---------- 预览 ----------
function previewCurrentForm() {
  if (!form.datasourceId || !form.sql) return
  emit('preview-sql', { datasourceId: form.datasourceId, sql: form.sql })
}
</script>

<style scoped lang="less">
/* 文件/抽取相关样式已随子组件迁移，父组件仅保留布局 */
</style>

<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增数据集' : '编辑数据集'"
    width="1000px"
    destroy-on-close
    @open="onOpen"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本配置" name="basic">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item label="数据集名称" prop="name">
            <el-input v-model="form.name" maxlength="100" placeholder="业务显示名" />
          </el-form-item>
          <el-form-item v-if="form.type === 'file'" label="数据类型">
            <el-tag type="warning" size="small">文件数据集 (Excel/CSV, 无需数据源)</el-tag>
          </el-form-item>
          <el-form-item v-else label="关联数据源" prop="datasourceId">
            <el-select
              v-model="form.datasourceId"
              filterable
              placeholder="选择数据源"
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
          <el-form-item label="缓存开关" prop="cacheEnabled">
            <el-switch v-model="form.cacheEnabled" />
            <span style="margin-left: 12px; color: #6b7280; font-size: 13px"
              >启用后相同查询在 TTL 内走内存缓存</span
            >
          </el-form-item>
          <el-form-item label="缓存 TTL" prop="cacheTtl">
            <el-input-number
              v-model="form.cacheTtl"
              :min="0"
              :max="86400"
              controls-position="right"
              style="width: 200px"
            />
            <span v-pre style="margin-left: 12px; color: #6b7280; font-size: 13px">秒</span>
          </el-form-item>
          <el-form-item label="描述">
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

      <el-tab-pane v-if="form.type === 'file'" label="数据文件" name="datafile">
        <DatasetEditFileTab
          :dataset-id="form.id"
          :file-data="form.fileData"
          @update:file-data="form.fileData = $event"
          @saved="emit('saved')"
          @preview-dataset="emit('preview-dataset', $event)"
        />
      </el-tab-pane>

      <el-tab-pane v-else label="SQL 查询" name="sql">
        <el-form :model="form" label-width="96px">
          <el-form-item label="SQL 查询" prop="sql">
            <SqlEditor
              v-model="form.sql"
              :height="240"
              label="SQL"
              placeholder="SELECT col1, col2 FROM table_name WHERE col = {{paramName}} ..."
            />
            <div v-pre style="color: #9ca3af; font-size: 12px; margin-top: 4px">
              仅允许 SELECT 查询。使用 {{ paramName }} 引用参数（在"参数配置"标签页定义）。
            </div>
          </el-form-item>
        </el-form>
        <el-button :disabled="!(form.datasourceId && form.sql)" @click="previewCurrentForm">
          校验 SQL 并预览
        </el-button>
      </el-tab-pane>

      <el-tab-pane
        :label="`参数配置${form.params && form.params.length ? ' (' + form.params.length + ')' : ''}`"
        name="params"
      >
        <DatasetParamsTab v-model:params="form.params" />
      </el-tab-pane>

      <el-tab-pane v-if="form.type !== 'file'" label="抽取模式" name="extract">
        <DatasetExtractTab :mode="mode" :dataset-id="form.id" />
      </el-tab-pane>

      <el-tab-pane
        :label="`字段管理${form.fields && form.fields.length ? ' (' + form.fields.length + ')' : ''}`"
        name="fields"
      >
        <DatasetFieldsTab
          v-model:fields="form.fields"
          :preview-columns="previewColumns"
          :preview-rows="previewRows"
        />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  createDataset,
  updateDataset,
} from '@/api/dataset'
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
} from './dataset-edit-utils'

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

/** 动态校验规则: 文件数据集无需数据源/SQL */
const rules = computed<FormRules>(() => {
  const base: FormRules = {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      { max: 100, trigger: 'blur' },
    ],
    cacheTtl: [
      { type: 'number', min: 0, max: 86400, message: 'TTL 需在 0-86400 秒', trigger: 'blur' },
    ],
  }
  if (form.type === 'file') return base
  base.datasourceId = [{ required: true, message: '请选择数据源', trigger: 'change' }]
  base.sql = [{ required: true, message: '请输入 SQL', trigger: 'blur' }]
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
    ElMessage.warning('请输入 SQL')
    return
  }
  submitting.value = true
  try {
    const payload = buildDatasetPayload(form, isFile)
    if (props.mode === 'create') {
      await createDataset(payload)
      ElMessage.success('创建数据集成功')
    } else if (form.id) {
      await updateDataset(form.id, payload)
      ElMessage.success('保存成功')
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

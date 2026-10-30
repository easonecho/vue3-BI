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
        <div v-if="form.fileData" class="file-meta">
          <div class="file-meta__row">
            <span class="file-meta__label">当前文件</span>
            <code>{{ form.fileData.fileName || '-' }}</code>
          </div>
          <div class="file-meta__row">
            <span class="file-meta__label">数据规模</span>
            <span>{{ form.fileData.rowCount ?? 0 }} 行</span>
          </div>
          <div class="file-meta__row">
            <span class="file-meta__label">更新时间</span>
            <span>{{ formatFileTime(form.fileData.updatedAt) }}</span>
          </div>
        </div>
        <div style="margin: 12px 0">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.csv"
            :on-change="onReplaceFileChange"
            :on-remove="() => (replaceFile = null)"
            :file-list="replaceFile ? [{ name: replaceFile.name }] : []"
          >
            <el-button size="small" type="primary" plain>
              <el-icon><Upload /></el-icon>&nbsp;选择新的数据文件
            </el-button>
            <template #tip>
              <div style="color: #9ca3af; font-size: 12px; margin-top: 4px">
                支持 .xlsx / .csv, 最大 10MB、5 万行; 替换后立即生效并清理缓存
              </div>
            </template>
          </el-upload>
        </div>
        <el-button
          type="success"
          :loading="replacing"
          :disabled="!replaceFile"
          @click="handleReplaceConfirm"
        >
          替换数据文件
        </el-button>
        <el-divider />
        <el-button @click="previewCurrentDataset">预览数据 (前 100 行)</el-button>
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
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          抽取模式将 SQL 结果物化为本地快照: 图表取数直接读快照, 不再实时查询源库。
          快照不会自动刷新, 源数据更新后需点击「立即抽取」。
        </el-alert>
        <template v-if="mode === 'edit'">
          <el-descriptions v-if="extractInfo.enabled" :column="3" border size="small">
            <el-descriptions-item label="状态">
              <el-tag type="success" size="small">已启用</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="快照行数">
              {{ extractInfo.rowCount }}
            </el-descriptions-item>
            <el-descriptions-item label="最近抽取">
              {{ formatFileTime(extractInfo.lastExtractAt || undefined) }}
            </el-descriptions-item>
          </el-descriptions>
          <el-empty
            v-if="!extractInfo.enabled"
            description="尚未启用抽取, 当前为实时查询"
            :image-size="60"
          />
          <div class="extract-actions">
            <el-button type="primary" :loading="extracting" @click="handleExtract">
              立即抽取
            </el-button>
            <el-popconfirm
              v-if="extractInfo.enabled"
              title="取消后将恢复实时查询源库, 确定吗?"
              @confirm="handleRemoveExtract"
            >
              <template #reference>
                <el-button :loading="removingExtract">取消抽取</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <el-alert v-else type="warning" :closable="false">保存数据集后才能执行抽取</el-alert>
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
import type { UploadFile } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import {
  type CreateDatasetParams,
  type DatasetField,
  createDataset,
  updateDataset,
  replaceDatasetData,
  getDatasetExtract,
  extractDataset,
  removeDatasetExtract,
  type DatasetExtractInfo,
} from '@/api/dataset'
import type { Dataset, DataSource } from '@/api/types'
import SqlEditor from '@/components/SqlEditor.vue'
import DatasetParamsTab from './DatasetParamsTab.vue'
import DatasetFieldsTab from './DatasetFieldsTab.vue'

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

// ---------- 抽取模式 (P2-1) ----------
const extracting = ref(false)
const removingExtract = ref(false)
const extractInfo = ref<DatasetExtractInfo>({
  enabled: false,
  rowCount: 0,
  lastExtractAt: null,
})

const form = reactive<
  CreateDatasetParams & {
    id?: number
    type?: 'sql' | 'file'
    fileData?: Dataset['fileData']
    /** UI 编辑态始终有值 (v-model 绑定要求非 undefined) */
    sql: string
    cacheTtl: number
  }
>({
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
    extractInfo.value = { enabled: false, rowCount: 0, lastExtractAt: null }
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
  replaceFile.value = null
  // 抽取状态单独拉取 (列表数据不含快照摘要)
  if (form.type !== 'file') loadExtractInfo(row.id)
}

async function loadExtractInfo(id: number) {
  try {
    const res = await getDatasetExtract(id)
    extractInfo.value = res.data
  } catch {
    extractInfo.value = { enabled: false, rowCount: 0, lastExtractAt: null }
  }
}

async function handleExtract() {
  if (!form.id) return
  extracting.value = true
  try {
    const res = await extractDataset(form.id)
    extractInfo.value = res.data
    ElMessage.success(
      res.data.truncated
        ? `数据抽取完成 (超过上限, 仅保留 ${res.data.rowCount} 行)`
        : `数据抽取完成 (${res.data.rowCount} 行)`,
    )
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    extracting.value = false
  }
}

async function handleRemoveExtract() {
  if (!form.id) return
  removingExtract.value = true
  try {
    await removeDatasetExtract(form.id)
    extractInfo.value = { enabled: false, rowCount: 0, lastExtractAt: null }
    ElMessage.success('已取消抽取, 恢复实时查询')
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    removingExtract.value = false
  }
}

// ---------- 字段管理 ----------

/** 编辑回填: 兼容旧数据中 format 为字符串的写法 */
function normalizeFieldForEdit(field: any): DatasetField {
  const format = field?.format
  return {
    ...field,
    format:
      format && typeof format === 'object' ? (format as DatasetField['format']) : undefined,
  }
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
    // 文件数据集不提交数据源/SQL
    const payload: CreateDatasetParams = isFile
      ? {
          name: form.name,
          description: form.description,
          cacheEnabled: form.cacheEnabled,
          cacheTtl: form.cacheTtl,
          fields: form.fields && form.fields.length ? form.fields : undefined,
        }
      : {
          name: form.name,
          datasourceId: form.datasourceId,
          sql: form.sql,
          description: form.description,
          cacheEnabled: form.cacheEnabled,
          cacheTtl: form.cacheTtl,
          fields: form.fields && form.fields.length ? form.fields : undefined,
          params: form.params && form.params.length ? form.params : undefined,
        }
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

// ---------- 文件数据集: 替换数据文件 ----------
const replacing = ref(false)
const replaceFile = ref<File | null>(null)

function onReplaceFileChange(file: UploadFile) {
  if (!acceptUpload(file)) return
  replaceFile.value = (file.raw as File) ?? null
}

/** 前置校验: 扩展名 + 大小 (后端仍会校验) */
function acceptUpload(file: UploadFile): boolean {
  const raw = file.raw as File | undefined
  if (!raw) return false
  const ext = raw.name.slice(raw.name.lastIndexOf('.')).toLowerCase()
  if (ext !== '.xlsx' && ext !== '.csv') {
    ElMessage.error(`不支持的文件格式 "${ext}", 仅支持 .xlsx / .csv`)
    return false
  }
  if (raw.size > 10 * 1024 * 1024) {
    ElMessage.error('文件超过 10MB 限制')
    return false
  }
  return true
}

async function handleReplaceConfirm() {
  if (!replaceFile.value || !form.id) return
  replacing.value = true
  try {
    const result = await replaceDatasetData(form.id, replaceFile.value)
    ElMessage.success(`数据已替换: ${result.rowCount} 行 / ${result.columns?.length ?? 0} 列`)
    replaceFile.value = null
    // 刷新对话框中的文件摘要 + 列表
    form.fileData = {
      fileName: result.fileName,
      fileSize: 0,
      rowCount: result.rowCount,
      updatedAt: new Date().toISOString(),
    }
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || '替换失败')
  } finally {
    replacing.value = false
  }
}

function formatFileTime(s?: string): string {
  if (!s) return '-'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN', { hour12: false })
}

// ---------- 预览 ----------
function previewCurrentDataset() {
  if (!form.id) return
  emit('preview-dataset', form.id)
}

function previewCurrentForm() {
  if (!form.datasourceId || !form.sql) return
  emit('preview-sql', { datasourceId: form.datasourceId, sql: form.sql })
}
</script>

<style scoped lang="less">
.file-meta {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 14px;
  .file-meta__row {
    display: flex;
    align-items: center;
    line-height: 26px;
    font-size: 13px;
  }
  .file-meta__label {
    width: 76px;
    color: #6b7280;
    flex-shrink: 0;
  }
}
.extract-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style>

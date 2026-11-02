import type { CreateDatasetParams, DatasetField } from '@/api/dataset'
import type { Dataset } from '@/api/types'

/** 数据集编辑对话框的 UI 表单状态（比接口入参多了编辑态字段） */
export type DatasetEditForm = CreateDatasetParams & {
  id?: number
  type?: 'sql' | 'file'
  fileData?: Dataset['fileData']
  /** UI 编辑态始终有值 (v-model 绑定要求非 undefined) */
  sql: string
  cacheTtl: number
}

/** 编辑回填: 兼容旧数据中 format 为字符串的写法 */
export function normalizeFieldForEdit(field: any): DatasetField {
  const format = field?.format
  return {
    ...field,
    format:
      format && typeof format === 'object' ? (format as DatasetField['format']) : undefined,
  }
}

export function formatFileTime(s?: string): string {
  if (!s) return '-'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN', { hour12: false })
}

export interface UploadValidation {
  ok: boolean
  message?: string
}

/** 文件上传前置校验: 扩展名 + 大小 (后端仍会校验) */
export function validateUploadFile(raw: File | null | undefined): UploadValidation {
  if (!raw) return { ok: false }
  const ext = raw.name.slice(raw.name.lastIndexOf('.')).toLowerCase()
  if (ext !== '.xlsx' && ext !== '.csv') {
    return { ok: false, message: `不支持的文件格式 "${ext}", 仅支持 .xlsx / .csv` }
  }
  if (raw.size > 10 * 1024 * 1024) {
    return { ok: false, message: '文件超过 10MB 限制' }
  }
  return { ok: true }
}

/** 构造提交入参：文件数据集不提交数据源/SQL */
export function buildDatasetPayload(form: DatasetEditForm, isFile: boolean): CreateDatasetParams {
  const fields = form.fields && form.fields.length ? form.fields : undefined
  if (isFile) {
    return {
      name: form.name,
      description: form.description,
      cacheEnabled: form.cacheEnabled,
      cacheTtl: form.cacheTtl,
      fields,
    }
  }
  return {
    name: form.name,
    datasourceId: form.datasourceId,
    sql: form.sql,
    description: form.description,
    cacheEnabled: form.cacheEnabled,
    cacheTtl: form.cacheTtl,
    fields,
    params: form.params && form.params.length ? form.params : undefined,
  }
}

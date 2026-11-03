/**
 * 数据集管理模块 API
 * P2 增强: 支持参数化查询 + 字段配置
 * P0 增强: 文件数据集 (Excel/CSV 上传/替换) + 计算字段表达式校验
 */
import { get, post, put, del, getToken } from '@/utils/request'
import axios from 'axios'
import type { Dataset, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 解析后的列信息 (文件数据集) */
export interface ParsedColumn {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date'
}

/** 参数定义 (参数化查询) */
export interface DatasetParam {
  name: string
  label?: string
  type: 'string' | 'number' | 'date' | 'datetime' | 'boolean'
  defaultValue?: unknown
  required?: boolean
}

/** 字段显示格式 (语义层) */
export interface DatasetFieldFormat {
  type?: 'number' | 'currency' | 'percent' | 'date' | 'text'
  /** 小数位 (0-6) */
  decimals?: number
  /** 前缀, 货币默认 ¥ */
  prefix?: string
  /** 后缀, 百分比默认 % */
  suffix?: string
}

/** 字段配置 (别名/类型/计算字段 + 语义元数据) */
export interface DatasetField {
  name: string
  alias?: string
  type?: 'string' | 'number' | 'date' | 'datetime' | 'boolean'
  visible?: boolean
  computed?: boolean
  expression?: string
  /** 语义角色: dimension=维度(分组字段), measure=度量(指标字段) */
  role?: 'dimension' | 'measure'
  /** 度量默认聚合方式 (none=不聚合) */
  defaultAggregate?: 'none' | AggregateFn
  /** 显示格式 */
  format?: DatasetFieldFormat
}

/** 创建数据集参数 (datasourceId/sql 仅 SQL 数据集必填; 文件数据集通过 uploadDataset 创建) */
export interface CreateDatasetParams {
  name: string
  description?: string
  datasourceId?: number
  sql?: string
  fields?: DatasetField[]
  params?: DatasetParam[]
  cacheEnabled?: boolean
  cacheTtl?: number
}

/** 获取数据集列表 */
export function getDatasetList(params: PageQuery) {
  return get<PaginateData<Dataset>>('/api/datasets', params as Record<string, unknown>)
}

/** 获取数据集详情 */
export function getDatasetDetail(id: number) {
  return get<Dataset>(`/api/datasets/${id}`)
}

/** 创建数据集 */
export function createDataset(data: CreateDatasetParams) {
  return post<Dataset>('/api/datasets', data)
}

/** 更新数据集 */
export function updateDataset(id: number, data: Partial<CreateDatasetParams>) {
  return put<Dataset>(`/api/datasets/${id}`, data)
}

/** 删除数据集 */
export function deleteDataset(id: number) {
  return del<null>(`/api/datasets/${id}`)
}

// ============================================================================
// 抽取模式 (P2-1)
// ============================================================================

export interface DatasetExtractInfo {
  enabled: boolean
  rowCount: number
  lastExtractAt: string | null
  /** 是否启用定时刷新 (P2-1) */
  refreshEnabled: boolean
  /** 定时刷新 cron (标准 5 段) */
  refreshCron: string | null
  /** 最近一次自动刷新时间 */
  lastAutoRunAt: string | null
  /** 抽取时是否因超过上限被截断 */
  truncated?: boolean
}

/** 定时刷新配置 */
export interface ExtractRefreshParams {
  enabled: boolean
  cron?: string
}

/** 手动抽取返回 (不含定时刷新配置) */
export type DatasetExtractResult = Pick<
  DatasetExtractInfo,
  'enabled' | 'rowCount' | 'lastExtractAt'
> & { truncated?: boolean }

/** 查询抽取状态 */
export function getDatasetExtract(id: number) {
  return get<DatasetExtractInfo>(`/api/datasets/${id}/extract`)
}

/** 立即抽取 (物化快照) */
export function extractDataset(id: number) {
  return post<DatasetExtractResult>(`/api/datasets/${id}/extract`)
}

/** 取消抽取 (删除快照, 恢复实时查询) */
export function removeDatasetExtract(id: number) {
  return del<null>(`/api/datasets/${id}/extract`)
}

/** 更新定时刷新配置 (需先执行抽取生成快照) */
export function updateDatasetExtractRefresh(id: number, data: ExtractRefreshParams) {
  return put<Pick<DatasetExtractInfo, 'refreshEnabled' | 'refreshCron'>>(
    `/api/datasets/${id}/extract/refresh`,
    data,
  )
}

/** 预览 SQL (临时, 无需已有数据集; 支持 params) */
export function previewSql(params: {
  datasourceId: number
  sql: string
  limit?: number
  params?: Record<string, unknown>
}) {
  return post<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  }>('/api/datasets/preview', params)
}

/** 执行数据集 SQL (支持 params) */
export function executeDataset(id: number, body?: { limit?: number; params?: Record<string, unknown> }) {
  return post<{
    columns: string[]
    rows: Record<string, unknown>[]
    rowCount: number
  }>(`/api/datasets/${id}/execute`, body ?? {})
}

// ============================================================================
// 聚合下推 (GROUP BY 在数据源侧执行)
// ============================================================================

export type AggregateFn = 'sum' | 'avg' | 'count' | 'countDistinct' | 'max' | 'min'

export interface AggregateMetric {
  /** 度量字段; count 时可省略表示 COUNT(*) */
  field?: string
  aggregate: AggregateFn
  /** 输出列名, 缺省为 field / aggregate */
  alias?: string
}

/** 聚合查询请求 (filters 复用行级权限条件结构) */
export interface DatasetQueryParams {
  groupBy?: string[]
  metrics: AggregateMetric[]
  filters?: RowCondition[]
  orderBy?: { field: string; direction?: 'asc' | 'desc' }
  limit?: number
  offset?: number
  params?: Record<string, unknown>
}

export interface DatasetQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

/** 聚合查询数据集 (服务端 GROUP BY, 避免前端采样导致指标失真) */
export function queryDataset(id: number, body: DatasetQueryParams) {
  return post<DatasetQueryResult>(`/api/datasets/${id}/query`, body)
}

// ============================================================================
// 服务端分页 (表格组件, W4)
// ============================================================================

export interface DatasetPageParams {
  offset?: number
  limit?: number
  params?: Record<string, unknown>
  /** 排序字段 (展示名/别名或原始列名) */
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  /** 联动/全局筛选 (字段使用展示名) */
  filters?: RowCondition[]
  /** SQL 数据集是否额外统计总行数 (默认 false, 避免每页扫全表) */
  withTotal?: boolean
}

export interface DatasetPageResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  offset: number
  limit: number
  hasMore: boolean
  /** 仅 withTotal=true 或文件/抽取快照时返回 */
  total?: number
  /** 文件/抽取快照超过服务端物化上限时标记 */
  truncated: boolean
}

/** 服务端分页取行 (表格组件不再一次性拉全量) */
export function fetchDatasetPage(id: number, body: DatasetPageParams = {}) {
  return post<DatasetPageResult>(`/api/datasets/${id}/rows`, body)
}

// ============================================================================
// 批量取数 (看板首屏一次请求多个数据集)
// ============================================================================

export interface DatasetBatchExecuteItem {
  /** 客户端标识, 用于对应响应 (可选) */
  key?: string
  kind: 'execute'
  datasetId: number
  limit?: number
  params?: Record<string, unknown>
}

export interface DatasetBatchQueryItem {
  key?: string
  kind: 'query'
  datasetId: number
  query: DatasetQueryParams
}

export interface DatasetBatchPageItem {
  key?: string
  kind: 'page'
  datasetId: number
  page?: DatasetPageParams
}

export type DatasetBatchItem = DatasetBatchExecuteItem | DatasetBatchQueryItem | DatasetBatchPageItem

/** 批量取数单项结果: 单项失败不影响其它项 */
export interface DatasetBatchItemResult<T = unknown> {
  key?: string
  datasetId: number
  kind: DatasetBatchItem['kind']
  ok: boolean
  data?: T
  error?: { code: number; message: string }
}

/** 批量取数 (最多 20 项/请求, 后端逐项返回成功或失败) */
export function fetchDatasetBatch(items: DatasetBatchItem[]) {
  // 批量请求可能包含多个大查询, 单独放宽超时 (默认 15s 容易在首屏被误判超时)
  return post<DatasetBatchItemResult[]>('/api/datasets/batch-query', { items }, { timeout: 120000 })
}

/** 上传数据集响应 */
export interface UploadDatasetResult extends Dataset {
  rowCount: number
  fileName: string
  columns: ParsedColumn[]
}

/**
 * 上传 Excel/CSV 创建文件数据集 (multipart/form-data)
 * 使用独立 axios 实例: request.ts 默认 Content-Type: application/json,
 * axios 检测到 FormData 会自动设置 multipart boundary
 */
export async function uploadDataset(
  file: File,
  meta: { name?: string; description?: string } = {},
): Promise<UploadDatasetResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (meta.name) formData.append('name', meta.name)
  if (meta.description) formData.append('description', meta.description)

  const token = getToken()
  const res = await axios.post('/api/datasets/upload', formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Trace-Id': `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    timeout: 120000, // 大文件解析给足时间
  })
  if (res.data?.code !== 0) {
    throw new Error(res.data?.message || '上传失败')
  }
  return res.data.data as UploadDatasetResult
}

/** 替换文件数据集的数据文件 (重新上传) */
export async function replaceDatasetData(id: number, file: File): Promise<UploadDatasetResult> {
  const formData = new FormData()
  formData.append('file', file)

  const token = getToken()
  const res = await axios.put(`/api/datasets/${id}/data`, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Trace-Id': `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    timeout: 120000,
  })
  if (res.data?.code !== 0) {
    throw new Error(res.data?.message || '替换失败')
  }
  return res.data.data as UploadDatasetResult
}

/** 校验计算字段表达式 (可选提供字段名列表, 校验表达式引用的字段是否存在) */
export function validateCalcExpression(expression: string, fields?: string[]) {
  return post<{
    valid: boolean
    error?: string
    unknownFields?: string[]
    identifiers?: string[]
  }>('/api/datasets/validate-expression', { expression, fields })
}

// ============================================================================
// 行级数据权限 (RLS)
// ============================================================================

export type RowPermissionOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'like'
  | 'isNull'
  | 'notNull'
  | 'between'

export type RowSubjectType = 'all' | 'role' | 'user' | 'dept'

export interface RowCondition {
  field: string
  operator: RowPermissionOperator
  value?: unknown
}

export interface RowPermission {
  id: number
  datasetId: number
  name: string
  subjectType: RowSubjectType
  subjectId?: number | null
  conditions: RowCondition[]
  enabled: boolean
  priority: number
  createdAt?: string
  updatedAt?: string
}

export interface RowPermissionInput {
  name: string
  subjectType: RowSubjectType
  subjectId?: number | null
  conditions: RowCondition[]
  enabled?: boolean
  priority?: number
}

export interface RowPermissionOptions {
  roles: { id: number; name: string; code: string }[]
  users: { id: number; username: string; nickname?: string }[]
  departments: { id: number; name: string }[]
}

/** 行级权限规则列表 */
export function getRowPermissions(datasetId: number) {
  return get<RowPermission[]>(`/api/datasets/${datasetId}/row-permissions`)
}

/** 行级权限选择器数据 (角色/用户/部门) */
export function getRowPermissionOptions() {
  return get<RowPermissionOptions>('/api/datasets/row-permission-options')
}

/** 新增行级权限规则 */
export function createRowPermission(datasetId: number, data: RowPermissionInput) {
  return post<RowPermission>(`/api/datasets/${datasetId}/row-permissions`, data)
}

/** 更新行级权限规则 */
export function updateRowPermission(datasetId: number, ruleId: number, data: RowPermissionInput) {
  return put<RowPermission>(`/api/datasets/${datasetId}/row-permissions/${ruleId}`, data)
}

/** 删除行级权限规则 */
export function deleteRowPermission(datasetId: number, ruleId: number) {
  return del<null>(`/api/datasets/${datasetId}/row-permissions/${ruleId}`)
}

// ============================================================================
// 列级数据权限 (字段隐藏)
// ============================================================================

export interface ColumnPermission {
  id: number
  datasetId: number
  name: string
  subjectType: RowSubjectType
  subjectId?: number | null
  /** 被隐藏的字段名 (数据集字段展示名/原始列名) */
  fields: string[]
  enabled: boolean
  priority: number
  createdAt?: string
  updatedAt?: string
}

export interface ColumnPermissionInput {
  name: string
  subjectType: RowSubjectType
  subjectId?: number | null
  fields: string[]
  enabled?: boolean
  priority?: number
}

/** 列级权限规则列表 */
export function getColumnPermissions(datasetId: number) {
  return get<ColumnPermission[]>(`/api/datasets/${datasetId}/column-permissions`)
}

/** 新增列级权限规则 */
export function createColumnPermission(datasetId: number, data: ColumnPermissionInput) {
  return post<ColumnPermission>(`/api/datasets/${datasetId}/column-permissions`, data)
}

/** 更新列级权限规则 */
export function updateColumnPermission(
  datasetId: number,
  ruleId: number,
  data: ColumnPermissionInput,
) {
  return put<ColumnPermission>(`/api/datasets/${datasetId}/column-permissions/${ruleId}`, data)
}

/** 删除列级权限规则 */
export function deleteColumnPermission(datasetId: number, ruleId: number) {
  return del<null>(`/api/datasets/${datasetId}/column-permissions/${ruleId}`)
}

import { describe, it, expect } from 'vitest'
import {
  type DatasetEditForm,
  buildDatasetPayload,
  formatFileTime,
  normalizeFieldForEdit,
  validateUploadFile,
} from './dataset-edit-utils'

function makeFile(name: string, size = 1024): File {
  const file = new File(['x'], name, { type: 'text/plain' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateUploadFile', () => {
  it('仅接受 .xlsx / .csv', () => {
    expect(validateUploadFile(makeFile('data.xlsx')).ok).toBe(true)
    expect(validateUploadFile(makeFile('data.CSV')).ok).toBe(true)
    const result = validateUploadFile(makeFile('data.txt'))
    expect(result.ok).toBe(false)
    expect(result.message).toContain('不支持的文件格式')
  })

  it('超过 10MB 拒绝上传', () => {
    const result = validateUploadFile(makeFile('big.csv', 10 * 1024 * 1024 + 1))
    expect(result.ok).toBe(false)
    expect(result.message).toBe('文件超过 10MB 限制')
  })

  it('空文件返回未通过', () => {
    expect(validateUploadFile(null)).toEqual({ ok: false })
  })
})

describe('buildDatasetPayload', () => {
  const form: DatasetEditForm = {
    name: '销售数据',
    datasourceId: 1,
    sql: 'select * from sales',
    cacheEnabled: true,
    cacheTtl: 300,
    description: 'desc',
    fields: [{ name: 'region', type: 'string' }],
    params: [],
    type: 'sql',
  }

  it('文件数据集不提交数据源/SQL', () => {
    expect(buildDatasetPayload({ ...form, type: 'file' }, true)).toEqual({
      name: '销售数据',
      description: 'desc',
      cacheEnabled: true,
      cacheTtl: 300,
      fields: form.fields,
    })
  })

  it('SQL 数据集包含数据源/SQL/参数，空数组转 undefined', () => {
    const payload = buildDatasetPayload({ ...form, fields: [], params: [] }, false)
    expect(payload).toMatchObject({
      datasourceId: 1,
      sql: 'select * from sales',
    })
    expect(payload.fields).toBeUndefined()
    expect(payload.params).toBeUndefined()
  })
})

describe('normalizeFieldForEdit / formatFileTime', () => {
  it('字符串 format 视为无效并移除', () => {
    expect(normalizeFieldForEdit({ key: 'a', format: 'number' }).format).toBeUndefined()
    expect(normalizeFieldForEdit({ key: 'a', format: { type: 'number' } }).format).toEqual({
      type: 'number',
    })
  })

  it('时间格式化对无效值回退 -', () => {
    expect(formatFileTime(undefined)).toBe('-')
    expect(formatFileTime('not-a-date')).toBe('-')
    expect(formatFileTime('2024-01-01T00:00:00.000Z')).not.toBe('-')
  })
})

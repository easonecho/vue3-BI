import { describe, it, expect } from 'vitest'
import {
  errorMessage,
  fileBaseName,
  formatSize,
  formatTime,
  inferMaterialType,
  typeLabel,
  typeTagType,
} from './material-utils'

describe('material-utils 类型展示', () => {
  it('typeLabel 映射已知类型，未知类型原样返回', () => {
    expect(typeLabel('video')).toBe('视频')
    expect(typeLabel('image')).toBe('图片')
    expect(typeLabel('decor')).toBe('装饰')
    expect(typeLabel('other')).toBe('other')
  })

  it('typeTagType 映射 el-tag 样式，未知类型回退 success', () => {
    expect(typeTagType('video')).toBe('primary')
    expect(typeTagType('image')).toBe('success')
    expect(typeTagType('decor')).toBe('warning')
    expect(typeTagType('other')).toBe('success')
  })
})

describe('material-utils 格式化', () => {
  it('formatSize 覆盖 B/KB/MB/GB 与空值', () => {
    expect(formatSize(0)).toBe('-')
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(2048)).toBe('2.0 KB')
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatSize(2 * 1024 * 1024 * 1024)).toBe('2.00 GB')
  })

  it('formatTime 格式化合法日期，非法/空值原样返回', () => {
    expect(formatTime('')).toBe('-')
    expect(formatTime('not-a-date')).toBe('not-a-date')
    expect(formatTime('2024-05-06T07:08:00')).toBe('2024-05-06 07:08')
  })
})

describe('material-utils 上传辅助', () => {
  it('inferMaterialType 依据 MIME 推断类型', () => {
    expect(inferMaterialType('video/mp4')).toBe('video')
    expect(inferMaterialType('image/png')).toBe('image')
    expect(inferMaterialType('application/json')).toBe('decor')
    expect(inferMaterialType('')).toBe('decor')
  })

  it('fileBaseName 去掉扩展名', () => {
    expect(fileBaseName('chart.png')).toBe('chart')
    expect(fileBaseName('archive.tar.gz')).toBe('archive.tar')
    expect(fileBaseName('noext')).toBe('noext')
  })

  it('errorMessage 优先使用 Error/对象 message，否则回退', () => {
    expect(errorMessage(new Error('boom'), '兜底')).toBe('boom')
    expect(errorMessage({ message: '上传失败' }, '兜底')).toBe('上传失败')
    expect(errorMessage({ message: '' }, '兜底')).toBe('兜底')
    expect(errorMessage(null, '兜底')).toBe('兜底')
    expect(errorMessage('str', '兜底')).toBe('兜底')
  })
})

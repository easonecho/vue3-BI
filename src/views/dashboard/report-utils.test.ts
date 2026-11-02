import { describe, it, expect } from 'vitest'
import { cellValue, formatTime } from './report-utils'

describe('report-utils.formatTime', () => {
  it('空值显示占位符', () => {
    expect(formatTime(null)).toBe('-')
    expect(formatTime('')).toBe('-')
  })

  it('按 zh-CN 24 小时制格式化时间', () => {
    const value = '2024-01-02T03:04:05.000Z'
    expect(formatTime(value)).toBe(new Date(value).toLocaleString('zh-CN', { hour12: false }))
  })
})

describe('report-utils.cellValue', () => {
  it('null/undefined 显示占位符，普通值转字符串', () => {
    expect(cellValue({ a: null, b: undefined, c: 0, d: false }, 'a')).toBe('-')
    expect(cellValue({ b: undefined }, 'b')).toBe('-')
    expect(cellValue({ c: 0 }, 'c')).toBe('0')
    expect(cellValue({ d: false }, 'd')).toBe('false')
    expect(cellValue({ e: '文本' }, 'e')).toBe('文本')
  })

  it('对象值序列化为 JSON', () => {
    expect(cellValue({ obj: { x: 1 } }, 'obj')).toBe('{"x":1}')
    expect(cellValue({ arr: [1, 2] }, 'arr')).toBe('[1,2]')
  })
})

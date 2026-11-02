import { describe, it, expect } from 'vitest'
import { formatTime } from './preview-utils'

describe('formatTime', () => {
  it('输出 HH:mm:ss 并补零', () => {
    expect(formatTime(new Date(2024, 0, 1, 9, 5, 7))).toBe('09:05:07')
    expect(formatTime(new Date(2024, 0, 1, 23, 59, 59))).toBe('23:59:59')
  })
})

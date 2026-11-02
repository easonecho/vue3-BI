import { describe, it, expect } from 'vitest'
import { formatK, pad } from './screen-utils'

describe('screen-utils', () => {
  it('pad 补零', () => {
    expect(pad(3)).toBe('03')
    expect(pad(12)).toBe('12')
  })

  it('formatK 万为单位缩写', () => {
    expect(formatK(986420)).toBe('98.6万')
    expect(formatK(9999)).toBe((9999).toLocaleString())
  })
})

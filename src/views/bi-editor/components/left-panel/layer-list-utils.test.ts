import { describe, it, expect } from 'vitest'
import { previewScaleStyle } from './layer-list-utils'

describe('previewScaleStyle', () => {
  it('按视口等比缩放且不超过 1 倍', () => {
    expect(previewScaleStyle(340, 260, 34, 26).transform).toBe(
      'translate(-50%, -50%) scale(0.1)',
    )
    expect(previewScaleStyle(20, 10, 34, 26).transform).toBe(
      'translate(-50%, -50%) scale(1)',
    )
  })

  it('宽高非法时回退到 1，避免除零', () => {
    const style = previewScaleStyle(0, 0, 34, 26)
    expect(style.width).toBe('1px')
    expect(style.height).toBe('1px')
    expect(style.transform).toBe('translate(-50%, -50%) scale(1)')
    expect(style.transformOrigin).toBe('center center')
  })
})

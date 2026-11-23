import { describe, it, expect } from 'vitest'
import {
  MOBILE_VIEWPORT_BREAKPOINT,
  computeDashboardScale,
  isDashboardVerticallyScrollable,
  resolveDashboardFitMode,
} from './dashboard-fit'

const design = { designWidth: 1920, designHeight: 1080 }

describe('resolveDashboardFitMode', () => {
  it('竖屏窄屏按宽度适配', () => {
    expect(resolveDashboardFitMode(390, 844)).toBe('width')
    expect(resolveDashboardFitMode(MOBILE_VIEWPORT_BREAKPOINT - 1, 900)).toBe('width')
  })

  it('横屏窄屏与宽屏完整缩放', () => {
    expect(resolveDashboardFitMode(667, 375)).toBe('contain')
    expect(resolveDashboardFitMode(MOBILE_VIEWPORT_BREAKPOINT, 500)).toBe('contain')
    expect(resolveDashboardFitMode(1440, 900)).toBe('contain')
  })

  it('尺寸非法时回落为完整缩放', () => {
    expect(resolveDashboardFitMode(0, 0)).toBe('contain')
    expect(resolveDashboardFitMode(390, 0)).toBe('contain')
  })
})

describe('computeDashboardScale', () => {
  it('宽屏取宽高缩放比的最小值', () => {
    expect(computeDashboardScale({ ...design, viewportWidth: 960, viewportHeight: 540 })).toBe(0.5)
    expect(computeDashboardScale({ ...design, viewportWidth: 1440, viewportHeight: 720 })).toBe(
      720 / 1080,
    )
  })

  it('竖屏窄屏按宽度缩放，不受高度限制', () => {
    expect(computeDashboardScale({ ...design, viewportWidth: 390, viewportHeight: 844 })).toBe(
      390 / 1920,
    )
  })

  it('可显式指定适配模式', () => {
    expect(
      computeDashboardScale({ ...design, viewportWidth: 390, viewportHeight: 844, mode: 'contain' }),
    ).toBe(390 / 1920)
    expect(
      computeDashboardScale({ ...design, viewportWidth: 1440, viewportHeight: 900, mode: 'width' }),
    ).toBe(0.75)
  })

  it('尺寸非法时返回 1', () => {
    expect(computeDashboardScale({ ...design, viewportWidth: 0, viewportHeight: 0 })).toBe(1)
    expect(
      computeDashboardScale({
        viewportWidth: 800,
        viewportHeight: 600,
        designWidth: 0,
        designHeight: 1080,
      }),
    ).toBe(1)
  })
})

describe('isDashboardVerticallyScrollable', () => {
  it('缩放后高于视口时需要纵向滚动', () => {
    expect(isDashboardVerticallyScrollable(3000, 0.5, 700)).toBe(true)
    expect(isDashboardVerticallyScrollable(1080, 0.5, 540)).toBe(false)
  })

  it('1px 内视为不需要滚动', () => {
    expect(isDashboardVerticallyScrollable(1080, 0.5, 540)).toBe(false)
    expect(isDashboardVerticallyScrollable(1084, 0.5, 540)).toBe(true)
  })

  it('非法参数返回 false', () => {
    expect(isDashboardVerticallyScrollable(0, 1, 800)).toBe(false)
    expect(isDashboardVerticallyScrollable(1080, 0, 800)).toBe(false)
    expect(isDashboardVerticallyScrollable(1080, 1, 0)).toBe(false)
  })
})

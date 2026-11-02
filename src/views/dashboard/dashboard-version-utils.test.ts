import { describe, it, expect } from 'vitest'
import type { DashboardVersion, DashboardVersionSnapshot } from '@/api/dashboard-version'
import { countComponents, formatCanvasSize, formatVersionTime } from './dashboard-version-utils'

function makeDetail(overrides: Partial<DashboardVersionSnapshot> = {}): DashboardVersion {
  return {
    id: 1,
    dashboardId: 9,
    versionNo: 2,
    name: '销售看板',
    remark: null,
    creatorId: 1,
    createdAt: '2024-01-02T03:04:05.000Z',
    snapshot: {
      name: '销售看板',
      description: null,
      layout: { components: [], canvas: null },
      thumbnail: null,
      status: 1,
      isPublic: false,
      groupId: null,
      chartCount: 0,
      capturedAt: '2024-01-02T03:04:05.000Z',
      ...overrides,
    },
  }
}

describe('formatVersionTime', () => {
  it('空值与无效时间回退占位符', () => {
    expect(formatVersionTime(null)).toBe('-')
    expect(formatVersionTime(undefined)).toBe('-')
    expect(formatVersionTime('not-a-date')).toBe('-')
  })

  it('有效时间格式化为本地时间字符串', () => {
    const text = formatVersionTime('2024-01-02T03:04:05.000Z')
    expect(text).not.toBe('-')
    expect(text).toContain('2024')
  })
})

describe('countComponents', () => {
  it('无详情时返回 0', () => {
    expect(countComponents(null)).toBe(0)
  })

  it('统计快照中的画布组件数量', () => {
    const detail = makeDetail({
      layout: { components: [{ id: 1 }, { id: 2 }, { id: 3 }], canvas: null },
    })
    expect(countComponents(detail)).toBe(3)
  })

  it('缺少 components 字段时返回 0', () => {
    const detail = makeDetail({ layout: { canvas: null } })
    expect(countComponents(detail)).toBe(0)
  })
})

describe('formatCanvasSize', () => {
  it('无画布或尺寸缺失时返回占位符', () => {
    expect(formatCanvasSize(null)).toBe('-')
    expect(formatCanvasSize(makeDetail({ layout: null }))).toBe('-')
    expect(formatCanvasSize(makeDetail({ layout: { canvas: { width: 0, height: 1080 } } }))).toBe('-')
    expect(formatCanvasSize(makeDetail({ layout: { canvas: {} } }))).toBe('-')
  })

  it('画布宽高齐全时返回格式化尺寸', () => {
    const detail = makeDetail({ layout: { canvas: { width: 1920, height: 1080 } } })
    expect(formatCanvasSize(detail)).toBe('1920 × 1080')
  })
})

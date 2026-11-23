import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RECENT_DASHBOARDS_KEY,
  RECENT_DASHBOARDS_LIMIT,
  formatRecentTime,
  readRecentDashboards,
  recordRecentDashboard,
} from './recent-dashboards'

describe('recent-dashboards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('记录访问并置顶去重', () => {
    recordRecentDashboard({ id: 1, name: '销售看板' }, 1000)
    recordRecentDashboard({ id: 2, name: '库存看板' }, 2000)
    const list = recordRecentDashboard({ id: 1, name: '销售看板 V2' }, 3000)

    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ id: 1, name: '销售看板 V2', visitedAt: 3000 })
    expect(list[1]).toMatchObject({ id: 2, name: '库存看板' })
    expect(readRecentDashboards()).toEqual(list)
  })

  it('按时间倒序并限制条数', () => {
    for (let i = 1; i <= RECENT_DASHBOARDS_LIMIT + 3; i += 1) {
      recordRecentDashboard({ id: i, name: `看板 ${i}` }, i * 1000)
    }
    const list = readRecentDashboards()

    expect(list).toHaveLength(RECENT_DASHBOARDS_LIMIT)
    expect(list[0].id).toBe(RECENT_DASHBOARDS_LIMIT + 3)
    expect(list[list.length - 1].id).toBe(4)
  })

  it('忽略名称为空或 ID 非法的记录', () => {
    recordRecentDashboard({ id: Number.NaN, name: '异常看板' }, 1000)
    recordRecentDashboard({ id: 9, name: '   ' }, 2000)
    expect(readRecentDashboards()).toEqual([])
  })

  it('容错损坏的本地存储内容', () => {
    localStorage.setItem(RECENT_DASHBOARDS_KEY, '{not-json')
    expect(readRecentDashboards()).toEqual([])

    localStorage.setItem(
      RECENT_DASHBOARDS_KEY,
      JSON.stringify([{ id: '1', name: '字符串 ID' }, { id: 2, name: '正常看板', visitedAt: 1 }]),
    )
    expect(readRecentDashboards()).toEqual([{ id: 2, name: '正常看板', visitedAt: 1 }])
  })

  it('存储写入异常不影响返回结果', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const list = recordRecentDashboard({ id: 3, name: '配额看板' }, 1000)

    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(3)
    spy.mockRestore()
  })
})

describe('formatRecentTime', () => {
  const now = Date.parse('2026-06-01T12:00:00')

  it('一小时内按刚刚/分钟展示', () => {
    expect(formatRecentTime(now, now)).toBe('刚刚')
    expect(formatRecentTime(now - 59_000, now)).toBe('刚刚')
    expect(formatRecentTime(now - 60_000, now)).toBe('1分钟前')
    expect(formatRecentTime(now - 59 * 60_000, now)).toBe('59分钟前')
  })

  it('一天内按小时展示', () => {
    expect(formatRecentTime(now - 3_600_000, now)).toBe('1小时前')
    expect(formatRecentTime(now - 23 * 3_600_000, now)).toBe('23小时前')
  })

  it('一周内按天展示，更早显示日期', () => {
    expect(formatRecentTime(now - 86_400_000, now)).toBe('1天前')
    expect(formatRecentTime(now - 6 * 86_400_000, now)).toBe('6天前')
    expect(formatRecentTime(now - 8 * 86_400_000, now)).toBe('2026-05-24')
  })

  it('未来时间戳按刚刚处理', () => {
    expect(formatRecentTime(now + 60_000, now)).toBe('刚刚')
  })
})

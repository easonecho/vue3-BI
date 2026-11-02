import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMaterialList } from './useMaterialList'
import type { Material, MaterialListQuery } from '@/api/material'

const { listMock, deleteMock, messageMock } = vi.hoisted(() => ({
  listMock: vi.fn<(query: MaterialListQuery) => Promise<{
    data: { list: Material[]; total: number }
  }>>(),
  deleteMock: vi.fn<(id: number) => Promise<unknown>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('@/api/material', () => ({
  getMaterialList: listMock,
  deleteMaterial: deleteMock,
}))

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 1,
    name: '封面图',
    type: 'image',
    fileName: 'cover.png',
    originalName: 'cover.png',
    mimeType: 'image/png',
    size: 2048,
    url: '/uploads/cover.png',
    thumbnail: null,
    width: null,
    height: null,
    description: null,
    creatorId: 1,
    createdAt: '2024-05-06T07:08:00.000Z',
    updatedAt: '2024-05-06T07:08:00.000Z',
    ...overrides,
  }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: { list: [], total: 0 } })
  deleteMock.mockResolvedValue(null)
})

describe('useMaterialList 加载列表', () => {
  it('写入列表与总数，默认查询第一页 12 条且不带筛选', async () => {
    listMock.mockResolvedValueOnce({
      data: { list: [makeMaterial({ id: 1 }), makeMaterial({ id: 2 })], total: 5 },
    })
    const api = useMaterialList()
    await api.loadList()

    expect(api.list.value).toHaveLength(2)
    expect(api.total.value).toBe(5)
    expect(listMock).toHaveBeenCalledWith({
      page: 1,
      pageSize: 12,
      type: undefined,
      keyword: undefined,
    })
    expect(api.loading.value).toBe(false)
  })

  it('携带类型与关键字筛选', async () => {
    const api = useMaterialList()
    api.filters.type = 'video'
    api.filters.keyword = ' 宣传 '
    await api.loadList()

    expect(listMock).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 12,
      type: 'video',
      keyword: ' 宣传 ',
    })
  })

  it('加载失败时提示异常信息并复位 loading', async () => {
    listMock.mockRejectedValueOnce(new Error('网络错误'))
    const api = useMaterialList()
    await api.loadList()

    expect(messageMock.error).toHaveBeenCalledWith('网络错误')
    expect(api.loading.value).toBe(false)
  })

  it('非 Error 异常使用默认文案', async () => {
    listMock.mockRejectedValueOnce('unknown')
    const api = useMaterialList()
    await api.loadList()
    expect(messageMock.error).toHaveBeenCalledWith('加载素材列表失败')
  })
})

describe('useMaterialList 查询与重置', () => {
  it('handleSearch 回到第一页并重新加载', async () => {
    const api = useMaterialList()
    api.page.value = 3
    api.handleSearch()
    await flush()

    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
  })

  it('handleReset 清空筛选、回到第一页并加载', async () => {
    const api = useMaterialList()
    api.filters.keyword = '视频'
    api.filters.type = 'video'
    api.page.value = 4

    api.handleReset()
    await flush()

    expect(api.filters.keyword).toBe('')
    expect(api.filters.type).toBe('')
    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenCalledWith({
      page: 1,
      pageSize: 12,
      type: undefined,
      keyword: undefined,
    })
  })

  it('reloadFromFirstPage 重置页码并返回加载 Promise', async () => {
    const api = useMaterialList()
    api.page.value = 5
    await api.reloadFromFirstPage()
    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
  })
})

describe('useMaterialList 删除素材', () => {
  it('删除当前页最后一条时回退一页并刷新', async () => {
    const api = useMaterialList()
    api.page.value = 2
    api.pageSize.value = 12
    api.list.value = [makeMaterial({ id: 9 })]

    await api.handleDelete(makeMaterial({ id: 9 }))

    expect(deleteMock).toHaveBeenCalledWith(9)
    expect(messageMock.success).toHaveBeenCalledWith('删除成功')
    expect(api.page.value).toBe(1)
    expect(listMock).toHaveBeenCalledTimes(1)
  })

  it('当前页还有其它素材时保持页码', async () => {
    const api = useMaterialList()
    api.page.value = 2
    api.list.value = [makeMaterial({ id: 9 }), makeMaterial({ id: 10 })]

    await api.handleDelete(makeMaterial({ id: 9 }))

    expect(api.page.value).toBe(2)
  })

  it('第一页最后一条不回退到第 0 页', async () => {
    const api = useMaterialList()
    api.page.value = 1
    api.list.value = [makeMaterial({ id: 9 })]

    await api.handleDelete(makeMaterial({ id: 9 }))

    expect(api.page.value).toBe(1)
  })

  it('删除失败时提示异常且不刷新', async () => {
    deleteMock.mockRejectedValueOnce(new Error('无权限'))
    const api = useMaterialList()
    api.page.value = 2
    api.list.value = [makeMaterial({ id: 9 })]

    await api.handleDelete(makeMaterial({ id: 9 }))

    expect(messageMock.error).toHaveBeenCalledWith('无权限')
    expect(listMock).not.toHaveBeenCalled()
  })
})

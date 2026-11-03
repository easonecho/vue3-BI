/**
 * 看板首屏批量取数调度器单测
 * 覆盖: 同帧合并、相同请求去重、单项失败隔离、整体失败回退、超 20 项分片。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/dataset', () => ({
  fetchDatasetBatch: vi.fn(),
  executeDataset: vi.fn(),
  queryDataset: vi.fn(),
  fetchDatasetPage: vi.fn(),
}))

import {
  fetchDatasetBatch,
  executeDataset,
  type DatasetBatchItem,
  type DatasetBatchItemResult,
} from '@/api/dataset'
import {
  flushDatasetBatchQueueForTest,
  requestDatasetExecute,
  requestDatasetQuery,
  requestDatasetPage,
  resetDatasetBatchForTest,
} from './dataset-batch'

const fetchBatchMock = vi.mocked(fetchDatasetBatch)
const executeMock = vi.mocked(executeDataset)

function okResult(item: DatasetBatchItem, data: unknown): DatasetBatchItemResult {
  return {
    key: item.key,
    datasetId: item.datasetId,
    kind: item.kind,
    ok: true,
    data,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetDatasetBatchForTest()
})

afterEach(() => {
  resetDatasetBatchForTest()
})

describe('dataset-batch 调度器', () => {
  it('同一帧内的多个取数请求合并为一次 batch-query', async () => {
    fetchBatchMock.mockImplementation(async (items) => ({
      code: 0,
      message: 'ok',
      data: items.map((item) =>
        okResult(item, { columns: ['id'], rows: [{ id: item.datasetId, kind: item.kind }], rowCount: 1 }),
      ),
    }))

    const p1 = requestDatasetExecute(1, 5000)
    const p2 = requestDatasetQuery(2, { metrics: [{ aggregate: 'sum', field: 'v' }] })
    const p3 = requestDatasetPage(3, { offset: 0, limit: 200 })

    await flushDatasetBatchQueueForTest()

    expect(fetchBatchMock).toHaveBeenCalledTimes(1)
    expect(fetchBatchMock.mock.calls[0][0]).toHaveLength(3)

    const [r1, r2, r3] = await Promise.all([p1, p2, p3])
    expect(r1.rows).toEqual([{ id: 1, kind: 'execute' }])
    expect(r2.rows).toEqual([{ id: 2, kind: 'query' }])
    expect(r3.rows).toEqual([{ id: 3, kind: 'page' }])
  })

  it('相同数据集+参数的请求自动去重', async () => {
    fetchBatchMock.mockImplementation(async (items) => ({
      code: 0,
      message: 'ok',
      data: items.map((item) => okResult(item, { columns: [], rows: [], rowCount: 0 })),
    }))

    const p1 = requestDatasetExecute(1, 5000)
    const p2 = requestDatasetExecute(1, 5000)

    await flushDatasetBatchQueueForTest()

    expect(fetchBatchMock).toHaveBeenCalledTimes(1)
    expect(fetchBatchMock.mock.calls[0][0]).toHaveLength(1)

    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toEqual(r2)
  })

  it('单项失败只影响对应请求', async () => {
    fetchBatchMock.mockImplementation(async (items) => ({
      code: 0,
      message: 'ok',
      data: items.map((item, index) =>
        index === 1
          ? {
              key: item.key,
              datasetId: item.datasetId,
              kind: item.kind,
              ok: false,
              error: { code: 40001, message: '数据集不存在' },
            }
          : okResult(item, { columns: [], rows: [{ ok: true }], rowCount: 1 }),
      ),
    }))

    const p1 = requestDatasetExecute(1, 5000)
    const p2 = requestDatasetExecute(2, 5000)

    await flushDatasetBatchQueueForTest()

    await expect(p1).resolves.toMatchObject({ rows: [{ ok: true }] })
    await expect(p2).rejects.toThrow('数据集不存在')
  })

  it('批量接口整体不可用时回退到单请求', async () => {
    fetchBatchMock.mockRejectedValue(new Error('404 not found'))
    executeMock.mockResolvedValue({
      code: 0,
      message: 'ok',
      data: { columns: ['id'], rows: [{ id: 1 }], rowCount: 1 },
    })

    const p1 = requestDatasetExecute(1, 5000)
    const p2 = requestDatasetExecute(2, 5000)

    await flushDatasetBatchQueueForTest()

    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1.rows).toEqual([{ id: 1 }])
    expect(r2.rows).toEqual([{ id: 1 }])
    expect(executeMock).toHaveBeenCalledTimes(2)
    expect(executeMock).toHaveBeenCalledWith(1, { limit: 5000 })
    expect(executeMock).toHaveBeenCalledWith(2, { limit: 5000 })
  })

  it('超过 20 项时自动分片为多次请求', async () => {
    fetchBatchMock.mockImplementation(async (items) => ({
      code: 0,
      message: 'ok',
      data: items.map((item) => okResult(item, { columns: [], rows: [], rowCount: 0 })),
    }))

    const promises = Array.from({ length: 21 }, (_, i) => requestDatasetExecute(i + 1, 5000))
    await flushDatasetBatchQueueForTest()

    expect(fetchBatchMock).toHaveBeenCalledTimes(2)
    expect(fetchBatchMock.mock.calls[0][0]).toHaveLength(20)
    expect(fetchBatchMock.mock.calls[1][0]).toHaveLength(1)
    await Promise.all(promises)
  })
})

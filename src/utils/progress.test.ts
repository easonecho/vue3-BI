import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('nprogress', () => ({
  default: {
    configure: vi.fn(),
    start: vi.fn(),
    done: vi.fn(),
  },
}))

import NProgress from 'nprogress'
import { doneProgress, resetProgress, startProgress } from './progress'

const start = vi.mocked(NProgress.start)
const done = vi.mocked(NProgress.done)

describe('progress 并发计数', () => {
  beforeEach(() => {
    resetProgress()
    vi.clearAllMocks()
  })

  it('并发任务只在首个启动、最后一个结束', () => {
    startProgress()
    startProgress()
    expect(start).toHaveBeenCalledTimes(1)

    doneProgress()
    expect(done).not.toHaveBeenCalled()

    doneProgress()
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('未开始即结束不会误关进度条', () => {
    doneProgress()
    expect(done).not.toHaveBeenCalled()
  })

  it('resetProgress 强制收尾并清零', () => {
    startProgress()
    startProgress()

    resetProgress()
    expect(done).toHaveBeenCalledTimes(1)

    // 已清零，多余的 done 不应重复收尾
    doneProgress()
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('任务全部结束后可重新启动', () => {
    startProgress()
    doneProgress()
    startProgress()

    expect(start).toHaveBeenCalledTimes(2)
  })
})

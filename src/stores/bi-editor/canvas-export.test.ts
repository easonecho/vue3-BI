import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const mocks = vi.hoisted(() => ({
  exportDashboardPdf: vi.fn(),
  saveAs: vi.fn(),
}))

vi.mock('@/api/export', () => ({
  exportDashboardPdf: mocks.exportDashboardPdf,
  saveAs: mocks.saveAs,
}))

import { createCanvasExport } from './canvas-export'

function setup(name = '销售看板') {
  const api = createCanvasExport({
    dashboardName: ref(name),
    isExportingPng: ref(false),
  })
  api.registerExportPng(async () => 'data:image/png;base64,AAAA')
  return api
}

describe('画布导出 PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('将画布 PNG 交给服务端并保存返回的 PDF', async () => {
    mocks.exportDashboardPdf.mockResolvedValue({ blob: new Blob(['pdf']), truncated: false })

    const ok = await setup().exportCanvasAsPdf()

    expect(ok).toBe(true)
    expect(mocks.exportDashboardPdf).toHaveBeenCalledWith({
      name: '销售看板',
      image: 'data:image/png;base64,AAAA',
    })
    expect(mocks.saveAs).toHaveBeenCalledTimes(1)
    expect(mocks.saveAs.mock.calls[0][1]).toMatch(/^销售看板_\d{8}_\d{6}\.pdf$/)
  })

  it('服务端导出失败时返回 false 且不触发下载', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.exportDashboardPdf.mockRejectedValue(new Error('boom'))

    const ok = await setup().exportCanvasAsPdf()

    expect(ok).toBe(false)
    expect(mocks.saveAs).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('未注册画布回调时直接返回 false', async () => {
    const api = createCanvasExport({
      dashboardName: ref('看板'),
      isExportingPng: ref(false),
    })

    expect(await api.exportCanvasAsPdf()).toBe(false)
    expect(mocks.exportDashboardPdf).not.toHaveBeenCalled()
  })
})

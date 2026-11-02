import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHeaderExport } from './useHeaderExport'
import type { useBiEditorStore } from '@/stores/bi-editor'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

const { ElMessageMock } = vi.hoisted(() => ({
  ElMessageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('element-plus', () => ({ ElMessage: ElMessageMock }))

function setup(options: {
  components?: unknown[]
  png?: () => Promise<boolean>
  pdf?: () => Promise<boolean>
} = {}) {
  const store = {
    components: options.components ?? [{}],
    exportCanvasAsPng: vi.fn(options.png ?? (async () => true)),
    exportCanvasAsPdf: vi.fn(options.pdf ?? (async () => true)),
  }
  return { api: useHeaderExport(store as unknown as BiEditorStore), raw: store }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useHeaderExport PNG', () => {
  it('空画布时提示且不调用导出', async () => {
    const { api, raw } = setup({ components: [] })
    await api.handleExportPng()
    expect(ElMessageMock.warning).toHaveBeenCalledWith('画布上还没有组件，无法导出')
    expect(raw.exportCanvasAsPng).not.toHaveBeenCalled()
  })

  it('导出成功提示', async () => {
    const { api, raw } = setup()
    await api.handleExportPng()
    expect(raw.exportCanvasAsPng).toHaveBeenCalledTimes(1)
    expect(ElMessageMock.success).toHaveBeenCalled()
  })

  it('导出返回 false 时提示失败', async () => {
    const { api } = setup({ png: async () => false })
    await api.handleExportPng()
    expect(ElMessageMock.error).toHaveBeenCalledWith('导出 PNG 失败，请刷新后重试')
  })

  it('导出抛错时捕获并提示', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { api } = setup({ png: async () => { throw new Error('boom') } })
    await api.handleExportPng()
    expect(errorSpy).toHaveBeenCalled()
    expect(ElMessageMock.error).toHaveBeenCalledWith('导出 PNG 失败')
    errorSpy.mockRestore()
  })
})

describe('useHeaderExport PDF', () => {
  it('空画布时提示且不调用导出', async () => {
    const { api, raw } = setup({ components: [] })
    await api.handleExportPdf()
    expect(ElMessageMock.warning).toHaveBeenCalledWith('画布上还没有组件，无法导出')
    expect(raw.exportCanvasAsPdf).not.toHaveBeenCalled()
  })

  it('导出成功提示打印', async () => {
    const { api, raw } = setup()
    await api.handleExportPdf()
    expect(raw.exportCanvasAsPdf).toHaveBeenCalledTimes(1)
    expect(ElMessageMock.success).toHaveBeenCalledWith('已打开打印窗口，请选择「另存为 PDF」')
  })

  it('导出返回 false 时提示失败', async () => {
    const { api } = setup({ pdf: async () => false })
    await api.handleExportPdf()
    expect(ElMessageMock.error).toHaveBeenCalledWith('导出 PDF 失败（若浏览器拦截弹窗，请允许后重试）')
  })

  it('导出抛错时捕获并提示', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { api } = setup({ pdf: async () => { throw new Error('boom') } })
    await api.handleExportPdf()
    expect(errorSpy).toHaveBeenCalled()
    expect(ElMessageMock.error).toHaveBeenCalledWith('导出 PDF 失败')
    errorSpy.mockRestore()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMaterialPreview } from './useMaterialPreview'
import type { Material } from '@/api/material'

const { downloadUrlMock } = vi.hoisted(() => ({
  downloadUrlMock: vi.fn<(id: number) => string>(),
}))

vi.mock('@/api/material', () => ({
  getMaterialDownloadUrl: downloadUrlMock,
}))

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 9,
    name: '封面图',
    type: 'image',
    fileName: 'cover.png',
    originalName: 'cover-original.png',
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

beforeEach(() => {
  vi.clearAllMocks()
  downloadUrlMock.mockReturnValue('/api/materials/9/download')
})

describe('useMaterialPreview 预览', () => {
  it('openPreview 记录素材并打开对话框', () => {
    const api = useMaterialPreview()
    const material = makeMaterial()

    expect(api.previewVisible.value).toBe(false)
    api.openPreview(material)

    expect(api.previewMaterial.value?.id).toBe(9)
    expect(api.previewVisible.value).toBe(true)
  })
})

describe('useMaterialPreview 下载', () => {
  it('创建隐藏下载链接触发点击后移除', () => {
    const api = useMaterialPreview()
    const material = makeMaterial()
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    api.handleDownload(material)

    expect(downloadUrlMock).toHaveBeenCalledWith(9)
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
    expect(anchor.tagName).toBe('A')
    expect(anchor.getAttribute('href')).toBe('/api/materials/9/download')
    expect(anchor.getAttribute('download')).toBe('cover-original.png')
    expect(anchor.target).toBe('_blank')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith(anchor)

    appendSpy.mockRestore()
    removeSpy.mockRestore()
    clickSpy.mockRestore()
  })

  it('缺少 originalName 时使用素材名称作为下载名', () => {
    const api = useMaterialPreview()
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    api.handleDownload(makeMaterial({ originalName: '' }))

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
    expect(anchor.getAttribute('download')).toBe('封面图')

    appendSpy.mockRestore()
    clickSpy.mockRestore()
  })

  it('空素材不创建下载链接', () => {
    const api = useMaterialPreview()
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    api.handleDownload(null)

    expect(appendSpy).not.toHaveBeenCalled()
    expect(downloadUrlMock).not.toHaveBeenCalled()

    appendSpy.mockRestore()
  })
})

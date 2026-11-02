import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UploadFile, UploadInstance } from 'element-plus'
import { useMaterialUpload } from './useMaterialUpload'

const { uploadMock, messageMock } = vi.hoisted(() => ({
  uploadMock: vi.fn<(file: File, params: unknown) => Promise<unknown>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
}))

vi.mock('@/api/material', () => ({
  uploadMaterial: uploadMock,
}))

function makeFile(name: string, type: string) {
  return new File(['content'], name, { type })
}

function setup(onSuccess = vi.fn(async () => {})) {
  const api = useMaterialUpload({ onSuccess })
  return { api, onSuccess }
}

beforeEach(() => {
  vi.clearAllMocks()
  uploadMock.mockResolvedValue({})
})

describe('useMaterialUpload 表单状态', () => {
  it('resetForm 恢复默认值', () => {
    const { api } = setup()
    api.form.file = makeFile('a.png', 'image/png')
    api.form.name = '自定义'
    api.form.type = 'video'
    api.form.description = '描述'

    api.resetForm()

    expect(api.form.file).toBeNull()
    expect(api.form.name).toBe('')
    expect(api.form.type).toBe('image')
    expect(api.form.description).toBe('')
  })

  it('onFileChange 按 MIME 推断类型并自动填充名称', () => {
    const { api } = setup()
    api.onFileChange({ raw: makeFile('clip.mp4', 'video/mp4') } as UploadFile)

    expect(api.form.type).toBe('video')
    expect(api.form.name).toBe('clip')
    expect(api.form.file?.name).toBe('clip.mp4')
  })

  it('图片文件推断为 image，已有名称不被覆盖', () => {
    const { api } = setup()
    api.form.name = '封面'
    api.onFileChange({ raw: makeFile('cover.png', 'image/png') } as UploadFile)

    expect(api.form.type).toBe('image')
    expect(api.form.name).toBe('封面')
  })

  it('非媒体 MIME 归为装饰素材', () => {
    const { api } = setup()
    api.onFileChange({ raw: makeFile('border.svg', 'image/svg+xml') } as UploadFile)
    expect(api.form.type).toBe('image')

    // 重新选择文件时清空名称，验证 JSON 自动命名
    api.resetForm()
    api.onFileChange({ raw: makeFile('data.json', 'application/json') } as UploadFile)
    expect(api.form.type).toBe('decor')
    expect(api.form.name).toBe('data')
  })

  it('没有 raw 时忽略变更', () => {
    const { api } = setup()
    api.form.file = makeFile('keep.png', 'image/png')
    api.onFileChange({} as UploadFile)
    expect(api.form.file?.name).toBe('keep.png')
  })

  it('onFileExceed 提示一次只能上传一个文件', () => {
    const { api } = setup()
    api.onFileExceed()
    expect(messageMock.warning).toHaveBeenCalledWith('一次只能上传一个文件，请先删除已选文件')
  })
})

describe('useMaterialUpload 提交', () => {
  it('未选择文件时提示并返回 false', async () => {
    const { api, onSuccess } = setup()
    const result = await api.submitUpload()

    expect(result).toBe(false)
    expect(messageMock.warning).toHaveBeenCalledWith('请先选择文件')
    expect(uploadMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('上传成功时清理文件、通知父级并返回 true', async () => {
    const clearFiles = vi.fn()
    const { api, onSuccess } = setup()
    api.uploadRef.value = { clearFiles } as unknown as UploadInstance
    api.form.file = makeFile('clip.mp4', 'video/mp4')
    api.form.type = 'video'

    const result = await api.submitUpload()

    expect(result).toBe(true)
    expect(uploadMock).toHaveBeenCalledWith(api.form.file, {
      name: undefined,
      type: 'video',
      description: undefined,
    })
    expect(messageMock.success).toHaveBeenCalledWith('上传成功')
    expect(clearFiles).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(api.uploading.value).toBe(false)
  })

  it('填写名称与描述时随表单提交', async () => {
    const { api } = setup()
    api.form.file = makeFile('cover.png', 'image/png')
    api.form.name = '封面图'
    api.form.description = '首页封面'

    await api.submitUpload()

    expect(uploadMock).toHaveBeenCalledWith(api.form.file, {
      name: '封面图',
      type: 'image',
      description: '首页封面',
    })
  })

  it('上传失败时提示异常、不通知父级并复位 uploading', async () => {
    uploadMock.mockRejectedValueOnce(new Error('服务异常'))
    const { api, onSuccess } = setup()
    api.form.file = makeFile('cover.png', 'image/png')

    const result = await api.submitUpload()

    expect(result).toBe(false)
    expect(messageMock.error).toHaveBeenCalledWith('服务异常')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(messageMock.success).not.toHaveBeenCalled()
    expect(api.uploading.value).toBe(false)
  })

  it('非 Error 异常使用默认上传失败文案', async () => {
    uploadMock.mockRejectedValueOnce('unknown')
    const { api } = setup()
    api.form.file = makeFile('cover.png', 'image/png')

    await api.submitUpload()

    expect(messageMock.error).toHaveBeenCalledWith('上传失败，请重试')
  })
})

/**
 * 素材管理模块 API
 * 视频/图片/装饰边框等大屏素材的上传、列表、删除、下载
 */
import { get, del } from '@/utils/request'
import axios from 'axios'
import type { PaginateData } from '@/utils/request'
import { getToken } from '@/utils/request'

/** 素材分类 */
export type MaterialType = 'video' | 'image' | 'decor'

/** 素材实体 (对应后端 Material model) */
export interface Material {
  id: number
  name: string
  type: MaterialType
  fileName: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnail: string | null
  width: number | null
  height: number | null
  description: string | null
  creatorId: number
  createdAt: string
  updatedAt: string
}

/** 列表查询参数 */
export interface MaterialListQuery {
  page?: number
  pageSize?: number
  type?: MaterialType
  keyword?: string
}

/** 上传参数 */
export interface UploadMaterialParams {
  name?: string
  type?: MaterialType
  description?: string
}

/** 获取素材列表 */
export function getMaterialList(params: MaterialListQuery) {
  return get<PaginateData<Material>>('/api/materials', params as Record<string, unknown>)
}

/** 获取素材详情 */
export function getMaterialDetail(id: number) {
  return get<Material>(`/api/materials/${id}`)
}

/** 上传素材 (multipart/form-data)
 *  使用独立 axios 实例, 因为 request.ts 默认 Content-Type: application/json,
 *  上传文件需要 multipart/form-data, axios 检测到 FormData 会自动设置 boundary.
 */
export async function uploadMaterial(file: File, params: UploadMaterialParams = {}): Promise<Material> {
  const formData = new FormData()
  formData.append('file', file)
  if (params.name) formData.append('name', params.name)
  if (params.type) formData.append('type', params.type)
  if (params.description) formData.append('description', params.description)

  const token = getToken()
  const res = await axios.post('/api/materials/upload', formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Trace-Id': `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    timeout: 300000, // 5 分钟超时 (大文件)
  })
  return res.data?.data as Material
}

/** 删除素材 */
export function deleteMaterial(id: number) {
  return del<null>(`/api/materials/${id}`)
}

/** 获取素材下载 URL */
export function getMaterialDownloadUrl(id: number): string {
  return `/api/materials/${id}/download`
}

/**
 * 角色管理模块 API
 */
import { get, post, put, del } from '@/utils/request'
import type { Role, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 获取角色列表 (分页) */
export function getRoleList(params: PageQuery) {
  return get<PaginateData<Role>>('/api/roles', params as Record<string, unknown>)
}

/** 获取全部角色 (不分页, 用于下拉选择) */
export function getAllRoles() {
  return get<Role[]>('/api/roles/all/list')
}

/** 获取角色详情 */
export function getRoleDetail(id: number) {
  return get<Role>(`/api/roles/${id}`)
}

/** 创建角色 */
export function createRole(data: Partial<Role> & { name: string; code: string }) {
  return post<Role>('/api/roles', data)
}

/** 更新角色 */
export function updateRole(id: number, data: Partial<Role>) {
  return put<Role>(`/api/roles/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: number) {
  return del<null>(`/api/roles/${id}`)
}

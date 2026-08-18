/**
 * 用户管理模块 API
 */
import { get, post, put, del } from '@/utils/request'
import type { User, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

export interface CreateUserPayload {
  username: string
  password: string
  email?: string
  phone?: string
  nickname?: string
  avatar?: string
  roleId?: number
  departmentId?: number
  status?: number
}

/** 获取用户列表 */
export function getUserList(params: PageQuery) {
  return get<PaginateData<User>>('/api/users', params as Record<string, unknown>)
}

/** 获取用户详情 */
export function getUserDetail(id: number) {
  return get<User>(`/api/users/${id}`)
}

/** 创建用户 */
export function createUser(data: CreateUserPayload) {
  return post<User>('/api/users', data)
}

/** 更新用户 */
export function updateUser(id: number, data: Partial<User>) {
  return put<User>(`/api/users/${id}`, data)
}

/** 删除用户 */
export function deleteUser(id: number) {
  return del<null>(`/api/users/${id}`)
}

/** 修改密码 */
export function changePassword(id: number, data: { oldPassword?: string; newPassword: string }) {
  return put<null>(`/api/users/${id}/password`, data)
}

/** 修改用户角色 */
export function changeUserRole(id: number, roleId: number) {
  return put<User>(`/api/users/${id}/role`, { roleId })
}

/** 获取所有角色 (走 role 模块新接口) */
export { getAllRoles as getRoles } from './role'

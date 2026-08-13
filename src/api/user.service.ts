/**
 * 用户管理模块 API
 */
import { get, put, del } from '@/utils/request'
import type { User, Role, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 获取用户列表 */
export function getUserList(params: PageQuery) {
  return get<PaginateData<User>>('/api/users', params as Record<string, unknown>)
}

/** 获取用户详情 */
export function getUserDetail(id: number) {
  return get<User>(`/api/users/${id}`)
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

/** 获取所有角色 */
export function getRoles() {
  return get<Role[]>('/api/users/roles/all')
}
/**
 * 部门管理模块 API
 */
import { get, post, put, del } from '@/utils/request'
import type { Department, PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

/** 获取部门列表 (分页, 扁平) */
export function getDepartmentList(params: PageQuery) {
  return get<PaginateData<Department>>('/api/departments', params as Record<string, unknown>)
}

/** 获取全部部门 (不分页, 扁平) */
export function getAllDepartments() {
  return get<Department[]>('/api/departments/all/list')
}

/** 获取部门树 (仅启用状态) */
export function getDepartmentTree() {
  return get<Department[]>('/api/departments/tree/list')
}

/** 获取部门详情 */
export function getDepartmentDetail(id: number) {
  return get<Department>(`/api/departments/${id}`)
}

/** 创建部门 */
export function createDepartment(data: Partial<Department> & { name: string }) {
  return post<Department>('/api/departments', data)
}

/** 更新部门 */
export function updateDepartment(id: number, data: Partial<Department>) {
  return put<Department>(`/api/departments/${id}`, data)
}

/** 删除部门 */
export function deleteDepartment(id: number) {
  return del<null>(`/api/departments/${id}`)
}
